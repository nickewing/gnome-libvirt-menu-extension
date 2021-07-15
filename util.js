/* exported parseVirshTable, objectsEqual */

function matchAll(pattern, str) {
  let matches = [];
  let match;

  while ((match = pattern.exec(str)) !== null) {
    matches.push(match);
  }

  return matches;
}

function objectsEqual(o1, o2) {
  const entries1 = Object.entries(o1);
  const entries2 = Object.entries(o2);
  if (entries1.length !== entries2.length) {
    return false;
  }
  for (let i = 0; i < entries1.length; ++i) {
    if (entries1[i][0] !== entries2[i][0]) {
      return false;
    }
    if (entries1[i][1] !== entries2[i][1]) {
      return false;
    }
  }

  return true;
}

function parseVirshTable(table) {
  const tableRows = table.split("\n");
  const headerRow = tableRows[0];

  const headerPattern = /[\w\d-_]+/g;
  const headers = matchAll(headerPattern, headerRow);

  const results = [];

  tableRows.slice(2).forEach(row => {
    if (row.trim().length > 0) {
      let result = {};
      let startPos, endPos;

      for (let i = 0; i < headers.length; i++) {
        if (i === 0) {
          startPos = 0;
        } else {
          startPos = headers[i].index;
        }

        if (i === headers.length - 1) {
          endPos = null;
        } else {
          endPos = headers[i + 1].index;
        }

        let value;
        if (endPos) {
          value = row.substring(startPos, endPos);
        } else {
          value = row.substring(startPos);
        }

        let header = headers[i][0];
        result[header] = value.trim();
      }

      results.push(result);
    }
  });

  return results;
}

function convertColor(hex){
  let chunks = [];
  let tmp, i;
  hex = hex.substr(1);

  if (hex.length === 3) {
    tmp = hex.split("");
    for (i=0; i < 3; i++){
      chunks.push(parseInt(tmp[i] + "" + tmp[i], 16));
    }
  } else if (hex.length === 6){
    tmp = hex.match(/.{2}/g);
    for (i=0; i < 3; i++){
      chunks.push(parseInt(tmp[i],16));
    }
  } else {
    return [false, null];
  }

  return [true, chunks];
}

