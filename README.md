# Ravi Joon, portfolio website

This repository holds the files of https://ravijoon.github.io/, the portfolio website of Ravi Joon.
Ravi is a Senior Product Designer at MightyBot. He designs AI agent platforms and fintech tools for regulated industries.

| Link | Access |
|---|---|
| [Portfolio](https://ravijoon.github.io/) | Needs a password. Ask Ravi for it. |
| [Resume (PDF)](https://ravijoon.github.io/Resume-RaviJoon-2026.pdf) | Open to everyone. |
| [LinkedIn](https://www.linkedin.com/in/ravijoon) | Open to everyone. |
| [Email](mailto:ravijoon52@gmail.com) | ravijoon52@gmail.com |

## Why the files are encrypted

The portfolio is private. GitHub Pages sends static files and cannot check a password, so the files are encrypted before they come here.

- The files in `d/` are the pages, the styles, the scripts and the project images. Each file is encrypted with AES-256-GCM. The file names tell nothing about the content.
- The key comes from the password with PBKDF2-SHA256 and 600,000 rounds. `lock.json` holds the salt and a check value, not the password and not the key.
- The visitor types the password on the password page. The browser makes the key, and the service worker `sw.js` decrypts each file in the browser. The password and the key do not go to a server.

## Files that are open

These files are readable without the password:

- `index.html` and `404.html`: the password page with a short public preview.
- `sw.js` and `lock.json`: the code and the data that open the site after the password.
- `Resume-RaviJoon-2026.pdf`: the resume.
- `og.png`: the share image for LinkedIn and other sites.
- The site icons, one font and the photo on the password page.
- `robots.txt`: it asks search engines not to read the site.

## Source

The source code is in a private repository. A build script writes all the files here, and each publish replaces this repository with one new commit. Do not edit the files here: the next publish removes the change.

Until 2026-11-18 the website was at https://ravijoon.github.io/Portfolio-2026/. Old links to that address go to the same page at the new address.
