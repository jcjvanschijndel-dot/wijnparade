#!/bin/bash
# Build script: generates JSON indexes from CMS markdown files
# This runs during Netlify build so the site loads content locally (no GitHub API needed)

node build-indexes.js
