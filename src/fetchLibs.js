/*
 * Copyright 2020 IceRock MAG Inc. Use of this source code is governed by the Apache 2.0 license.
 */

const axios = require('axios').default;
const xml2js = require('xml2js');
const fs = require('fs');

const githubToken = process.env.GITHUB_AUTH || process.argv[2];

let libraries = require('../libraries.json');

let parser = new xml2js.Parser();

function loadLibraryInfo(library, retryCount) {
    let gitHubRepo = library.github;
    let mavenUrl = library.maven;
    return axios
        .get(mavenUrl + "maven-metadata.xml")
        .then(response => parser.parseStringPromise(response.data))
        .then(data => data.metadata)
        .then(parseMavenMetadata)
        .then(metadata => fetchVersionsInfo(mavenUrl, metadata))
        .then(metadata => appendGitHubInfo(metadata, gitHubRepo))
        .then(metadata => {
            metadata.category = library.category;
            return metadata;
        })
        .catch(error => {
            console.log("Library error: ");
            console.log(error);

            if (retryCount < 3) {
                let newRetryCount = retryCount + 1;
                console.log(newRetryCount + " retry");
                return loadLibraryInfo(library, newRetryCount);
            } else return null;
        });
}

let infoPromises = libraries.map(value => loadLibraryInfo(value, 0));
Promise.all(infoPromises)
    .then(data => {
        let validData = data.filter(item => item != null);
        fs.writeFileSync("public/data.json", JSON.stringify(validData, null, ' '));
    })
    .catch(error => {
        console.log("FATAL ERROR: ");
        console.log(error);
    });

function parseMavenMetadata(metadata) {
    // console.log("parseMavenMetadata ");

    let versioning = metadata.versioning[0];

    return {
        groupId: metadata.groupId[0],
        artifactId: metadata.artifactId[0],
        path: metadata.groupId[0] + ":" + metadata.artifactId[0],
        latestVersion: versioning.latest[0],
        lastUpdated: versioning.lastUpdated[0],
        versions: versioning.versions[0].version
    };
}

function fetchVersionsInfo(baseUrl, metadata) {
    // console.log("fetchVersionsInfo " + baseUrl);

    let versionPromises = metadata.versions
        .map(version => fetchVersionInfo(baseUrl, metadata, version));

    return Promise.all(versionPromises)
        .then(function (versions) {
            metadata.versions = versions.filter(version => version.mpp === true);
            return metadata;
        });
}

function fetchVersionInfo(baseUrl, metadata, version) {
    // console.log("fetchVersionInfo " + baseUrl + " version " + version);

    let url = baseUrl + version + "/" + metadata.artifactId + "-" + version + ".module";
    let targetUrl = new URL(url).href;

    return axios.get(targetUrl, {
        maxRedirects: 50
    })
        .then(response => {
            let versionInfo = response.data;
            return fetchKotlinVersion(baseUrl, metadata, versionInfo)
                .then(kotlinVersion => {
                    if (kotlinVersion === undefined) {
                        console.log(metadata.path + ":" + version + " unknown kotlin");
                    }
                    return {
                        version: version,
                        mpp: true,
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
        })
        .catch(error => {
            if (error.config != null) {
                console.log(metadata.path + ":" + version + " not multiplatform - " + error.config.url + " not found");
            } else {
                console.log(error);
            }
            return {
                version: version,
                mpp: false
            }
        });
}

function fetchKotlinVersion(baseUrl, metadata, versionInfo) {
    // console.log("fetchKotlinVersion " + baseUrl);
    return fetchKotlinVersionFromVariant(baseUrl, metadata, versionInfo, versionInfo.variants, 0);
}

function fetchKotlinVersionFromVariant(baseUrl, metadata, versionInfo, variants, idx, retryCount) {
    // console.log("fetchKotlinVersionFromVariant " + baseUrl + " idx " + idx);
    let variant = variants[idx];
    if (variant == null) return Promise.resolve(undefined);

    // try found kotlin in implicit version dependencies
    let variantKotlinVersion = getKotlinVersionFromDependencies(variant.dependencies);
    if (variantKotlinVersion != null) return Promise.resolve(variantKotlinVersion);

    let available = variant["available-at"];
    if (available == null) return Promise.resolve(undefined);
    let url = available["url"];
    if (url == null) return Promise.resolve(undefined);

    let targetUrl = new URL(baseUrl + versionInfo.component.version + "/" + url).href;

    return axios
        .get(targetUrl)
        .then(function (response) {
            let variants = response.data.variants;
            return variants
                .map(variant => getKotlinVersionFromDependencies(variant.dependencies))
                .find(version => version !== undefined);
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
        }).catch(error => {
            console.log("Error of loading variant, will retry: " + error.response.status);

            if(retryCount < 3) {
                let newRetryCount = retryCount + 1;
                console.log("retry loading variant " + newRetryCount);
                return fetchKotlinVersionFromVariant(baseUrl, metadata, versionInfo, variants, idx, newRetryCount);
            } if (idx < variants.length - 1) {
                return fetchKotlinVersionFromVariant(baseUrl, metadata, versionInfo, variants, ++idx);
            } else {
                return undefined;
            }
        });
}

function appendGitHubInfo(metadata, githubRepo) {
    console.log("appendGitHubInfo " + githubRepo);

    return axios.get("https://api.github.com/repos/" + githubRepo,
        {
            headers: {
                "Authorization": "token " + githubToken,
                "Accept": "application/vnd.github.mercy-preview+json"
            }
        })
        .then(response => response.data)
        .then(repoInfo => {
            let license = "unknown";
            if (repoInfo.license != null) license = repoInfo.license.name;
            metadata.github = {
                name: repoInfo.name,
                full_name: repoInfo.full_name,
                html_url: repoInfo.html_url,
                description: repoInfo.description,
                stars_count: repoInfo.stargazers_count,
                watchers_count: repoInfo.subscribers_count,
                issues_count: repoInfo.open_issues_count,
                forks_count: repoInfo.forks_count,
                license: license,
                topics: repoInfo.topics
            };

            return metadata;
        });
}

function getKotlinVersionFromDependencies(dependencies) {
    if (dependencies == null) return undefined;

    let kotlinDependency = dependencies
        .find(dep => {
            return dep.group === "org.jetbrains.kotlin" && dep.module.startsWith("kotlin-stdlib");
        });

    if (kotlinDependency === undefined) return undefined;

    return kotlinDependency.version.requires;
}
