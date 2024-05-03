# node-red-contrib-pdf-reader

![NPM Version](https://img.shields.io/npm/v/node-red-contrib-pdf-reader) ![Node Current](https://img.shields.io/node/v/node-red-contrib-pdf-reader)

A Node-RED node to extract PDF text content. Heavily inspired by https://github.com/RedBackSpider/node-red-contrib-pdfjs

## Differences from the original repository

- Support for read files using file name is remove. Use a node to read a file and pass the contents to this node.
- Password support and Selecting specific page has been included
- Includes the latest (as of writing) version of https://github.com/mozilla/pdfjs-dist
- Only supports Node 18 and up (due to pdfjs-dist not supporting lower Node versions)
- Partial rewrite and JSDoc-annotated code

### Inputs

| Key                  | Description                                                                                                                |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| msg.payload.data     | (object \| string) Either a buffer object that corresponds to a pdf file or a filepath leading to a pdf file to be decoded |
| msg.payload.password | (string, optional) Password of the PDF file                                                                                |

### Config

| Key                       | Description                                                                                                                                                                                                                                                                                             |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| pages                     | (string, optional) List of pages and/or page ranges. If pages is not provided, includes all the pages of the PDF (e.g. 1, 2, 3-5)                                                                                                                                                                       |
| password                  | (string, optional) Password of the PDF file                                                                                                                                                                                                                                                             |
| Order text                | (boolean, optional) Check this option to force the text to be ordered top down using the y value if 'from top to bottom' is selected, or ordered left to right by it's x value if 'from left to right' is selected. If both options are selected, it will order from top to bottom, then left to right. |
| Merge text with next text | (boolean, optional) CWhen inserting text into output payload array, if the previous text inserted has the same x value (are in the same column), or same y value (are in the same row), concatenate the string to be inserted with the previous string with a space instead.                            |

### Outputs

`payload`

Results of the parsing will be returned as an array with each element in the array corresponding to a page in the pdf.
Each page in the array is stored as an array of objects which can be seen below. p is the order in the pdf document

```json
[
  {
    "p": 1,
    "x": 328.78, // distance away from the right edge
    "y": 1175.676, // distance away from the bottom of the page
    "t": "Survey Responses 1/02/19 - 31/04/19" // text content
  },
  {
    "p": 2,
    "x": 428.78,
    "y": 1175.676,
    "t": "Survey Responses 1/05/19 - 31/07/19"
  }
]
```
