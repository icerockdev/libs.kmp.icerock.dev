/*
 * Copyright 2020 IceRock MAG Inc. Use of this source code is governed by the Apache 2.0 license.
 */

const axios = require('axios').default;
const xml2js = require('xml2js');
const fs = require('fs');

let libraries = require('./libraries.json');

let parser = new xml2js.Parser();
let infoPromises = libraries.map(function (value) {
  let gitHubUrl = value.github;
  let mavenUrl = value.maven;
  return axios
    .get(mavenUrl + "maven-metadata.xml")
    .then(response => parser.parseStringPromise(response.data))
    .then(data => data.metadata)
    .then(parseMavenMetadata)
    .then(metadata => fetchVersionsInfo(mavenUrl, metadata))
    .then(metadata => {
      metadata.github = gitHubUrl;
      return metadata;
    });
});
Promise.all(infoPromises)
  .then(data => {
    if (!fs.existsSync("docs")) fs.mkdirSync("docs");

    fs.writeFileSync("docs/data.json", JSON.stringify(data));
  })
  .catch(error => {
    console.log(error);
  });

function parseMavenMetadata(metadata) {
  console.log("parseMavenMetadata " + metadata);

  let versioning = metadata.versioning[0];

  return {
    groupId: metadata.groupId[0],
    artifactId: metadata.artifactId[0],
    latestVersion: versioning.latest[0],
    lastUpdated: versioning.lastUpdated[0],
    versions: versioning.versions[0].version
  };
}

function fetchVersionsInfo(baseUrl, metadata) {
  console.log("fetchVersionsInfo " + baseUrl + " " + metadata);

  let versionPromises = metadata.versions
    .map(version => fetchVersionInfo(baseUrl, metadata, version));

  return Promise.all(versionPromises)
    .then(function (versions) {
      metadata.versions = versions;
      return metadata;
    });
}

function fetchVersionInfo(baseUrl, metadata, version) {
  console.log("fetchVersionInfo " + baseUrl + " metadata " + metadata + " version " + version);

  return axios.get(baseUrl + version + "/" + metadata.artifactId + "-" + version + ".module")
    .then(response => {
      let versionInfo = response.data;
      return fetchKotlinVersion(baseUrl, metadata, versionInfo)
        .then(kotlinVersion => {
          return {
            version: version,
            gradle: versionInfo.createdBy.gradle.version,
            kotlin: kotlinVersion,
            targets: versionInfo.variants.reduce(function (map, variant) {
              map[variant.name] = {
                platform: variant.attributes["org.jetbrains.kotlin.platform.type"],
                target: variant.attributes["org.jetbrains.kotlin.native.target"]
              };
              return map;
            }, {})
          };
        });
    });
}

function fetchKotlinVersion(baseUrl, metadata, versionInfo) {
  console.log("fetchKotlinVersion " + baseUrl + " metadata " + metadata + " versionInfo " + versionInfo);
  return fetchKotlinVersionFromVariant(baseUrl, metadata, versionInfo, versionInfo.variants, 0);
}

function fetchKotlinVersionFromVariant(baseUrl, metadata, versionInfo, variants, idx) {
  console.log("fetchKotlinVersionFromVariant " + baseUrl + " metadata " + metadata + " versionInfo " + versionInfo + " variants " + variants + " idx " + idx);

  return axios.get(baseUrl + versionInfo.component.version + "/" + variants[idx]["available-at"]["url"])
    .then(function (response) {
      let dependencies = response.data.variants[0].dependencies;
      if (dependencies == null) {
        return undefined;
      }
      let kotlinDependency = dependencies
        .find(dep => {
          return dep.group === "org.jetbrains.kotlin" && dep.module.startsWith("kotlin-stdlib");
        });
      return kotlinDependency.version.requires;
    }).then(version => {
      if (version === undefined) {
        if (idx < variants.length - 1) {
          return fetchKotlinVersionFromVariant(baseUrl, metadata, versionInfo, variants, ++idx);
        } else {
          return undefined;
        }
      } else {
        return version;
      }
    });
}
