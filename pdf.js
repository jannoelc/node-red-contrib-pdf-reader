/**
 * @param {string} printPages
 * @returns {number[]}
 */
function parsePages(printPages) {
  const pages = printPages.split(",");
  const pageArray = [];
  pages.forEach((page) => {
    if (page.includes("-")) {
      const range = page.split("-");
      for (let i = parseInt(range[0]); i <= parseInt(range[1]); i++) {
        pageArray.push(i);
      }
    } else {
      pageArray.push(parseInt(page));
    }
  });
  return Array.from(new Set(pageArray)).sort();
}

/**
 *
 * @param {import("node-red__registry").NodeAPI} RED
 */
module.exports = async function (RED) {
  /** @type {import("pdfjs-dist")} */
  const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");

  /**
   * @typedef {Object} Config
   * @property {string} pages
   * @property {string} password
   * @property {boolean} [sortByX=false]
   * @property {boolean} [sortByY=false]
   * @property {boolean} [combineRow=false]
   * @property {boolean} [combineColumn=false]
   */

  class PDFNode {
    /**
     * @constructor
     * @param {Config} config
     */
    constructor(config) {
      RED.nodes.createNode(this, config);
      this.pages = config.pages ?? "";
      this.password = config.password ?? "";
      this.sortByX = !!config.sortByX;
      this.sortByY = !!config.sortByY;
      this.combineRow = !!config.combineRow;
      this.combineColumn = !!config.combineColumn;

      /** @type {import("node-red__registry").Node & Config} */
      const node = this;

      node.on("input", async (msg) => {
        /** @type {string | number[] | ArrayBuffer | any[] | undefined} */
        const data = msg.payload.data;
        /** @type {string | undefined} */
        const password = msg.payload.password ?? node.password;

        if (!data) {
          node.error("FieldError: Missing payload data");
          return;
        }

        try {
          const pdfDocument = await pdfjsLib.getDocument({
            data,
            password,
          }).promise;
          const result = await this.retrievePdfTextContent(pdfDocument);
          node.send(result);
        } catch (error) {
          node.error(`UnknownError: Failed to load PDF ${e}`);
        }
      });
    }

    /** @param {import("pdfjs-dist").PDFDocumentProxy} pdfDocument */
    async retrievePdfTextContent(pdfDocument) {
      const pages = this.pages
        ? parsePages(this.pages)
        : Array.from({ length: pdfDocument.numPages }, (_, i) => i + 1);

      return Promise.all(
        pages.map((pageNum) => this.loadPage(pdfDocument, pageNum))
      );
    }

    /**
     * @param {import("pdfjs-dist").PDFDocumentProxy} pdfDocument
     * @param {number} pageNumber
     */
    async loadPage(pdfDocument, pageNumber) {
      const page = await pdfDocument.getPage(pageNumber);
      const content = await page.getTextContent();

      if (this.sortByX && this.sortByY) {
        content.items.sort(getSortFunction());
      }

      return this.combineFunction(content.items);
    }

    getSortFunction() {
      if (this.sortByX && this.sortByY) {
        return function sortByReverseYThenX(a, b) {
          if (a.transform[5] > b.transform[5]) {
            return -1;
          } else if (a.transform[5] < b.transform[5]) {
            return 1;
          } else {
            return a.transform[4] - b.transform[4];
          }
        };
      }
      if (this.sortByX) {
        return function sortByX(a, b) {
          return a.transform[4] - b.transform[4];
        };
      }
      if (this.sortByY) {
        return function sortByReverseY(a, b) {
          return b.transform[5] - a.transform[5];
        };
      }
    }

    /**
     * @param {Awaited<ReturnType<import("pdfjs-dist").PDFPageProxy["getTextContent"]>>['items']} textContent
     */
    combineFunction(textContent) {
      /**
       * @typedef {Object} PageText
       * @property {number} p
       * @property {number} x
       * @property {number} y
       * @property {string} t
       */
      /** @type {PageText[]} */
      const pageText = [];
      textContent.forEach((item, index) => {
        if (!index) {
          pageText.push({
            p: index,
            x: item.transform?.[4],
            y: item.transform?.[5],
            t: item.str?.trim(),
          });
          return;
        }

        if (
          (this.combineColumn &&
            item.transform?.[4] === pageText[pageText.length - 1].x) ||
          (this.combineRow &&
            item.transform?.[5] === pageText[pageText.length - 1].y)
        ) {
          pageText[pageText.length - 1].t += " " + item.str?.trim();
        } else {
          pageText.push({
            p: index,
            x: item.transform?.[4],
            y: item.transform?.[5],
            t: item.str?.trim(),
          });
        }
      });

      return pageText;
    }
  }

  RED.nodes.registerType("pdf", PDFNode);
};
