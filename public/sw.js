if (!self.define) {
  let e,
    s = {};
  const a = (a, n) => (
    (a = new URL(a + ".js", n).href),
    s[a] ||
      new Promise((s) => {
        if ("document" in self) {
          const e = document.createElement("script");
          ((e.src = a), (e.onload = s), document.head.appendChild(e));
        } else ((e = a), importScripts(a), s());
      }).then(() => {
        let e = s[a];
        if (!e) throw new Error(`Module ${a} didn’t register its module`);
        return e;
      })
  );
  self.define = (n, i) => {
    const t =
      e ||
      ("document" in self ? document.currentScript.src : "") ||
      location.href;
    if (s[t]) return;
    let c = {};
    const r = (e) => a(e, t),
      d = { module: { uri: t }, exports: c, require: r };
    s[t] = Promise.all(n.map((e) => d[e] || r(e))).then((e) => (i(...e), c));
  };
}
define(["./workbox-f1770938"], function (e) {
  "use strict";
  (importScripts(),
    self.skipWaiting(),
    e.clientsClaim(),
    e.precacheAndRoute(
      [
        {
          url: "/_next/static/chunks/160-711c0899da4ffc68.js",
          revision: "711c0899da4ffc68",
        },
        {
          url: "/_next/static/chunks/193-0ba7211ae621e0ed.js",
          revision: "0ba7211ae621e0ed",
        },
        {
          url: "/_next/static/chunks/342.ad97950c59694236.js",
          revision: "ad97950c59694236",
        },
        {
          url: "/_next/static/chunks/398-ccb706b83a204d94.js",
          revision: "ccb706b83a204d94",
        },
        {
          url: "/_next/static/chunks/4bd1b696-e908ad8a1682aed1.js",
          revision: "e908ad8a1682aed1",
        },
        {
          url: "/_next/static/chunks/549-f64f1d6f8804f42d.js",
          revision: "f64f1d6f8804f42d",
        },
        {
          url: "/_next/static/chunks/971.a38d5ff087d31da9.js",
          revision: "a38d5ff087d31da9",
        },
        {
          url: "/_next/static/chunks/app/YourLibrary/page-241639e74997bf52.js",
          revision: "241639e74997bf52",
        },
        {
          url: "/_next/static/chunks/app/_global-error/page-d7d9b6f2577f2eda.js",
          revision: "d7d9b6f2577f2eda",
        },
        {
          url: "/_next/static/chunks/app/_not-found/page-f60d9a0766036bdc.js",
          revision: "f60d9a0766036bdc",
        },
        {
          url: "/_next/static/chunks/app/auth/callback/page-f45e34d36eb1e53f.js",
          revision: "f45e34d36eb1e53f",
        },
        {
          url: "/_next/static/chunks/app/layout-3f47475e4ac5398b.js",
          revision: "3f47475e4ac5398b",
        },
        {
          url: "/_next/static/chunks/app/liked-songs/page-68253d2503ce7b8e.js",
          revision: "68253d2503ce7b8e",
        },
        {
          url: "/_next/static/chunks/app/musik/page-ff43019570eb9989.js",
          revision: "ff43019570eb9989",
        },
        {
          url: "/_next/static/chunks/app/page-205be512aa7b5321.js",
          revision: "205be512aa7b5321",
        },
        {
          url: "/_next/static/chunks/app/playlist/%5Bid%5D/page-5cffd362e1ad8867.js",
          revision: "5cffd362e1ad8867",
        },
        {
          url: "/_next/static/chunks/app/search/page-0f1560197bf07039.js",
          revision: "0f1560197bf07039",
        },
        {
          url: "/_next/static/chunks/framework-93cda6578f6c76ec.js",
          revision: "93cda6578f6c76ec",
        },
        {
          url: "/_next/static/chunks/main-8689e1de4c4ade7d.js",
          revision: "8689e1de4c4ade7d",
        },
        {
          url: "/_next/static/chunks/main-app-aa7db80e6e15ae16.js",
          revision: "aa7db80e6e15ae16",
        },
        {
          url: "/_next/static/chunks/next/dist/client/components/builtin/app-error-d7d9b6f2577f2eda.js",
          revision: "d7d9b6f2577f2eda",
        },
        {
          url: "/_next/static/chunks/next/dist/client/components/builtin/forbidden-d7d9b6f2577f2eda.js",
          revision: "d7d9b6f2577f2eda",
        },
        {
          url: "/_next/static/chunks/next/dist/client/components/builtin/global-error-4df2cbefbb66a369.js",
          revision: "4df2cbefbb66a369",
        },
        {
          url: "/_next/static/chunks/next/dist/client/components/builtin/not-found-d7d9b6f2577f2eda.js",
          revision: "d7d9b6f2577f2eda",
        },
        {
          url: "/_next/static/chunks/next/dist/client/components/builtin/unauthorized-d7d9b6f2577f2eda.js",
          revision: "d7d9b6f2577f2eda",
        },
        {
          url: "/_next/static/chunks/polyfills-42372ed130431b0a.js",
          revision: "846118c33b2c0e922d7b3a7676f81f6f",
        },
        {
          url: "/_next/static/chunks/webpack-bb74739fa8506e07.js",
          revision: "bb74739fa8506e07",
        },
        {
          url: "/_next/static/css/a9f3e92774f65930.css",
          revision: "a9f3e92774f65930",
        },
        {
          url: "/_next/static/dw6yLZuAYUIfHsHWeLAHR/_buildManifest.js",
          revision: "ad44fc4a84df900e95da0ce7869327a4",
        },
        {
          url: "/_next/static/dw6yLZuAYUIfHsHWeLAHR/_ssgManifest.js",
          revision: "b6652df95db52feb4daf4eca35380933",
        },
        { url: "/file.svg", revision: "d09f95206c3fa0bb9bd9fefabfd0ea71" },
        { url: "/globe.svg", revision: "2aaafa6a49b6563925fe440891e32717" },
        {
          url: "/icons/icon-192x192.png",
          revision: "d02bd34cea0696c85ec6fb6d18643340",
        },
        {
          url: "/icons/icon-512x512.png",
          revision: "1b40b2405a719ff1555ccf2f73a79ee4",
        },
        { url: "/manifest.json", revision: "3263ea2abd81313dcd4919d0b42465f8" },
        { url: "/next.svg", revision: "8e061864f388b47f33a1c3780831193e" },
        { url: "/nocturn.avif", revision: "dcc4fcf7dd13f8bc40cab5a001c72230" },
        {
          url: "/swe-worker-5c72df51bb1f6ee0.js",
          revision: "76fdd3369f623a3edcf74ce2200bfdd0",
        },
        { url: "/vercel.svg", revision: "c0af2f507b369b085b35ef4bbe3bcf1e" },
        { url: "/window.svg", revision: "a2760511c65806022ad20adf74370ff3" },
      ],
      { ignoreURLParametersMatching: [/^utm_/, /^fbclid$/] },
    ),
    e.cleanupOutdatedCaches(),
    e.registerRoute(
      "/",
      new e.NetworkFirst({
        cacheName: "start-url",
        plugins: [
          {
            cacheWillUpdate: async ({ response: e }) =>
              e && "opaqueredirect" === e.type
                ? new Response(e.body, {
                    status: 200,
                    statusText: "OK",
                    headers: e.headers,
                  })
                : e,
          },
        ],
      }),
      "GET",
    ),
    e.registerRoute(
      /^https:\/\/fonts\.(?:gstatic)\.com\/.*/i,
      new e.CacheFirst({
        cacheName: "google-fonts-webfonts",
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 4, maxAgeSeconds: 31536e3 }),
        ],
      }),
      "GET",
    ),
    e.registerRoute(
      /^https:\/\/fonts\.(?:googleapis)\.com\/.*/i,
      new e.StaleWhileRevalidate({
        cacheName: "google-fonts-stylesheets",
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 4, maxAgeSeconds: 604800 }),
        ],
      }),
      "GET",
    ),
    e.registerRoute(
      /\.(?:eot|otf|ttc|ttf|woff|woff2|font.css)$/i,
      new e.StaleWhileRevalidate({
        cacheName: "static-font-assets",
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 4, maxAgeSeconds: 604800 }),
        ],
      }),
      "GET",
    ),
    e.registerRoute(
      /\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,
      new e.StaleWhileRevalidate({
        cacheName: "static-image-assets",
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 64, maxAgeSeconds: 2592e3 }),
        ],
      }),
      "GET",
    ),
    e.registerRoute(
      /\/_next\/static.+\.js$/i,
      new e.CacheFirst({
        cacheName: "next-static-js-assets",
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 64, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET",
    ),
    e.registerRoute(
      /\/_next\/image\?url=.+$/i,
      new e.StaleWhileRevalidate({
        cacheName: "next-image",
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 64, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET",
    ),
    e.registerRoute(
      /\.(?:mp3|wav|ogg)$/i,
      new e.CacheFirst({
        cacheName: "static-audio-assets",
        plugins: [
          new e.RangeRequestsPlugin(),
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET",
    ),
    e.registerRoute(
      /\.(?:mp4|webm)$/i,
      new e.CacheFirst({
        cacheName: "static-video-assets",
        plugins: [
          new e.RangeRequestsPlugin(),
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET",
    ),
    e.registerRoute(
      /\.(?:js)$/i,
      new e.StaleWhileRevalidate({
        cacheName: "static-js-assets",
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 48, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET",
    ),
    e.registerRoute(
      /\.(?:css|less)$/i,
      new e.StaleWhileRevalidate({
        cacheName: "static-style-assets",
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET",
    ),
    e.registerRoute(
      /\/_next\/data\/.+\/.+\.json$/i,
      new e.StaleWhileRevalidate({
        cacheName: "next-data",
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET",
    ),
    e.registerRoute(
      /\.(?:json|xml|csv)$/i,
      new e.NetworkFirst({
        cacheName: "static-data-assets",
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET",
    ),
    e.registerRoute(
      ({ sameOrigin: e, url: { pathname: s } }) =>
        !(!e || s.startsWith("/api/auth/callback") || !s.startsWith("/api/")),
      new e.NetworkFirst({
        cacheName: "apis",
        networkTimeoutSeconds: 10,
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 16, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET",
    ),
    e.registerRoute(
      ({ request: e, url: { pathname: s }, sameOrigin: a }) =>
        "1" === e.headers.get("RSC") &&
        "1" === e.headers.get("Next-Router-Prefetch") &&
        a &&
        !s.startsWith("/api/"),
      new e.NetworkFirst({
        cacheName: "pages-rsc-prefetch",
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET",
    ),
    e.registerRoute(
      ({ request: e, url: { pathname: s }, sameOrigin: a }) =>
        "1" === e.headers.get("RSC") && a && !s.startsWith("/api/"),
      new e.NetworkFirst({
        cacheName: "pages-rsc",
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET",
    ),
    e.registerRoute(
      ({ url: { pathname: e }, sameOrigin: s }) => s && !e.startsWith("/api/"),
      new e.NetworkFirst({
        cacheName: "pages",
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET",
    ),
    e.registerRoute(
      ({ sameOrigin: e }) => !e,
      new e.NetworkFirst({
        cacheName: "cross-origin",
        networkTimeoutSeconds: 10,
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 3600 }),
        ],
      }),
      "GET",
    ),
    (self.__WB_DISABLE_DEV_LOGS = !0));
});
