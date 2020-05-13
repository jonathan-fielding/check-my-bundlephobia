const core = require("@actions/core");

exports.getMarkDownTable = (sizesAdded, sizesRemoved) => {
  let table = `
## 😱 Check my bundlephobia - New/Modified package report:

<details opened=false>
<summary>Action settings</summary>

**Treshold**: < ${core.getInput("threshold")} bytes
**Strict mode**: ${core.getInput("strict") ? "✅ enabled" : "❌ disabled"}

</details>

|  | name | gzip | size | pass
| -- | ----------- | ----------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | ----- |
`;
  sizesAdded.forEach((packageInfo, index) => {
    const sizeRemoved = sizesRemoved.find(({name}) => name === packageInfo.name);
      table += `| ${sizeRemoved ? 'New' : ''} | [${packageInfo.package}](https://bundlephobia.com/result?p=${
        packageInfo.package
      })  | ${(parseInt(packageInfo.gzip) / 1024).toFixed(1)}kB         | ${(
        packageInfo.size / 1024
      ).toFixed(1)}kB         | ${
        packageInfo.gzip > core.getInput("threshold") ? "❌" : "✅"
      }
`;

table += sizeRemoved ? `| Old | [${sizeRemoved.package}](https://bundlephobia.com/result?p=${
  sizeRemoved.package
})  | ${(parseInt(sizeRemoved.gzip) / 1024).toFixed(1)}kB         | ${(
  sizeRemoved.size / 1024
).toFixed(1)}kB         | ${
  packageInfo.gzip > core.getInput("threshold") ? "❌" : "✅"
}
` : ''
const gzipedDiff = sizeRemoved ? (((parseInt(packageInfo.gzip) / 1024).toFixed(1)) - ((parseInt(sizeRemoved.gzip) / 1024).toFixed(1))).toFixed(1) : 0; 
const sizeDiff = sizeRemoved ? (((parseInt(packageInfo.size) / 1024).toFixed(1)) - ((parseInt(sizeRemoved.size) / 1024).toFixed(1))).toFixed(1) : 0; 

table += sizeRemoved ? `| | | ${Math.sign(gzipedDiff) ? '+' : gzipedDiff === '0.0' ? '=' : ''}${gzipedDiff !== '0.0' ? gzipedDiff + 'kB' : ''}         | ${Math.sign(sizeDiff) ? '+' : ''}${sizeDiff !== '0.0' ? sizeDiff + 'kB' : ''}        | ` : ''

  });

  return table;
};

exports.getPackageListFromDiff = (diff) => {
  const stuffAdded = diff
    .split("\n")
    .filter((e) => e.includes("+   "))
    .map((e) => e.split(" ").join("").split("+").join("").split(",").join(""));
  const stuffRemoved = diff
    .split("\n")
    .filter((e) => e.includes("-   "))
    .map((e) => e.split(" ").join("").split("+").join("").split(",").join(""));
  const packagesAdded = stuffAdded.filter((name) => {
    const initIsQuote = name[0] === '"' || name[0] === "'";
    const endIsQuote =
      name[name.length - 1] === '"' || name[name.length - 1] === "'";
    const colonIndex = name.indexOf(":");
    const quoteBeforeColon =
      name[colonIndex - 1] === '"' || name[colonIndex] === "'";
    const quoteAfterColon =
      name[colonIndex + 1] === '"' || name[colonIndex] === "'";

    return (
      initIsQuote &&
      endIsQuote &&
      colonIndex &&
      quoteAfterColon &&
      quoteBeforeColon
    );
  });

  const packagesRemoved = stuffRemoved.filter((name) => {
    const initIsQuote = name[0] === "-";
    const endIsQuote =
      name[name.length - 1] === '"' || name[name.length - 1] === "'";
    const colonIndex = name.indexOf(":");
    const quoteBeforeColon =
      name[colonIndex - 1] === '"' || name[colonIndex] === "'";
    const quoteAfterColon =
      name[colonIndex + 1] === '"' || name[colonIndex] === "'";
    return (
      initIsQuote &&
      endIsQuote &&
      colonIndex &&
      quoteAfterColon &&
      quoteBeforeColon
    );
  });

  return {
    packagesAdded: packagesAdded.map((name) => {
      const noSpaces = name.split(" ").join("").split("+").join();
      const noBreaks = noSpaces.split("\n").join("");
      const noQuotes = noBreaks.split('"').join("").split("'").join("");
      const noCommas = noQuotes.split(",").join("");
      const noBrackets = noCommas.split("}").join("").split("{").join("");
      const versionSeparator = noBrackets.split(":");
      const [pkname, version] = versionSeparator;
      const versionParsed = isNaN(version[0]) ? version.substr(1) : version;
      return `${pkname}@${versionParsed}`;
    }),
    packagesRemoved: packagesRemoved.map((name) => {
      const noSpaces = name.split(" ").join("").split("-").join();
      const noBreaks = noSpaces.split("\n").join("");
      const noQuotes = noBreaks.split('"').join("").split("'").join("");
      const noCommas = noQuotes.split(",").join("");
      const noBrackets = noCommas.split("}").join("").split("{").join("");
      const versionSeparator = noBrackets.split(":");
      const [pkname, version] = versionSeparator;
      const versionParsed = isNaN(version[0]) ? version.substr(1) : version;
      return `${pkname}@${versionParsed}`;
    }),
  };
};
