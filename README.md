# Kotlin Multiplatform libraries list

[![Website](https://img.shields.io/badge/site-libs.kmp.icerock.dev-1f6feb)](https://libs.kmp.icerock.dev/)
[![License](https://img.shields.io/badge/license-Apache%202.0-blue)](LICENSE.md)

A searchable catalog of Kotlin Multiplatform libraries with metadata fetched automatically from Maven and GitHub. The site helps Kotlin teams discover reusable KMP packages by category, repository health, supported Kotlin version, and release activity.

## Table of contents
- [What this project does](#what-this-project-does)
- [How it works](#how-it-works)
- [Run locally](#run-locally)
- [Add your library](#add-your-library)
- [Repository layout](#repository-layout)
- [License](#license)

## What this project does
This repository powers <https://libs.kmp.icerock.dev/>, a public index of Kotlin Multiplatform libraries.

It is useful when you want to:
- browse KMP libraries by category
- compare package freshness and ecosystem metadata
- contribute a missing library to the public catalog
- rebuild the generated dataset locally

## How it works
1. `libraries.json` stores the source list of tracked libraries.
2. `src/fetchLibs.js` pulls Maven metadata and enriches it with GitHub information.
3. Generated library data is written to `public/data.json`.
4. The React app reads that dataset and builds the static site published in `docs/`.

## Run locally
```bash
npm install
npm run fetch
npm start
```

To build the published site locally:

```bash
npm run build
```

## Add your library
Add a new object to `libraries.json` with:
- `github` , repository in `owner/name` format
- `category` , the group where the library should appear
- `maven` , the Maven metadata directory URL for the artifact

Example:

```json
{
  "github": "org/name",
  "category": "category name",
  "maven": "url to your metadata artifact on maven repo"
}
```

## Repository layout
- `src/` , React app and metadata fetch logic
- `public/` , static assets and generated `data.json`
- `docs/` , built site published via GitHub Pages
- `.github/workflows/update-data.yml` , scheduled refresh automation

## License
Licensed under the [Apache License 2.0](LICENSE.md).
