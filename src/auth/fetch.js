/**
 *
 *  ## OVERVIEW
 *
 *  A central class used for making fetch requests.
 *
 */

const fetch = require("node-fetch");
const ProxyHTTPS = require("https-proxy-agent");
const ClientData = require("./data");
const Fingerprint = require("./fingerprint");
const UUID = require("./uuid");
const CookieGenerator = require("./cookie");
const { DiscordAPIError } = require("../util/error");

class Requester {
  constructor(proxy) {
    this.url = "https://discord.com";
    this.api = "v9";
    this.defaultData = new ClientData(
      "Windows",
      "Chromium",
      "109.0",
      undefined,
      undefined,
      new Fingerprint(),
      new UUID()
    );
    this.cookie = "";
    this.isRegistering = false;
    if (proxy !== undefined) {
      this.proxy = new ProxyHTTPS(proxy);
    }
  }
  async build_request(body, clientData, method, extraHeaders) {
    if (this.cookie.length === 0) {
      this.cookie = await new CookieGenerator(this).compile();
    }
    let fetchRequest = {
      headers: {
        accept: "*/*",
        "accept-language": "en-US,en;q=0.9",
        "content-type": "application/json",
        "sec-ch-ua": `"Not_A Brand";v="99", "Google Chrome";v="109", "Chromium";v="109"`,
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": `"Linux"`,
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        cookie: this.cookie,
        Referer: `${this.url}/`,
        "Referrer-Policy": "strict-origin-when-cross-origin",
        dnt: "1",
        origin: this.url,
        ...extraHeaders,
      },
      method: method,
    };
    if (clientData?.fingerprint?.fingerprint !== undefined) {
      fetchRequest.headers["x-fingerprint"] =
        clientData.fingerprint.fingerprint;
    }
    if (clientData.xtrack !== undefined) {
      if (this.isRegistering) {
        fetchRequest.headers["x-track"] = clientData.xtrack;
      } else {
        fetchRequest.headers["x-super-properties"] = clientData.xtrack;
      }
    }
    if (clientData.ua !== undefined) {
      fetchRequest.headers["user-agent"] = clientData.ua;
    }
    if (clientData.authorization !== undefined) {
      fetchRequest.headers["authorization"] = clientData.authorization;
    }
    if (method === "POST" || method === "PATCH") {
      if (typeof body !== "object") throw new Error("Invalid body");
      fetchRequest.body = JSON.stringify(body);
    } else if (method === "GET") {
      fetchRequest.body = null;
    }
    if (this.proxy !== undefined) {
      fetchRequest["agent"] = this.proxy;
    }
    return fetchRequest;
  }

  build_noparse() {
    let fetchRequest = {
      method: "GET",
    };

    if (this.proxy !== undefined) {
      fetchRequest["agent"] = this.proxy;
    }
  }

  async fetch_request(
    url,
    body,
    clientData = this.defaultData,
    method = "POST",
    extraHeaders = {}
  ) {
    const fetchRequest = await this.build_request(
      body,
      clientData,
      method,
      extraHeaders
    );
    console.log(`${this.url}/api/${this.api}/${url}`, fetchRequest); // For logging fetches
    return new Promise((resolve) => {
      fetch(`${this.url}/api/${this.api}/${url}`, fetchRequest)
        .then(async (res) => {
          try {
            resolve(await res.json());
          } catch (e) {
            resolve(res.status);
          }
        })
        .catch((res) => {
          resolve({ internalError: true, error: res });
        });
    });
  }
  async fetch_noparse(url) {
    const fetchRequest = this.build_noparse();
    return fetch(url, fetchRequest);
  }
}

module.exports = Requester;

// fetch(
//   "https://discord.com/api/v9/channels/1102078723357945957/application-commands/search?type=1&limit=10&cursor=WzExMDIxNDE0MDk1MDAzNDQzNDIsIDAsIDEwODkyMzMwMzEyMjg4MjU2ODFd&command_ids=972289487818334209%2C938956540159881230%2C994261739745050684%2C1089233031056855195&include_applications=false",
//   {
//     headers: {
//       accept: "*/*",
//       "accept-language": "en-US,en;q=0.9",
//       authorization:
//         "MjEyNDQyNjY1NTU4NDc0NzUy.G4y1BQ.aPcyuDlDUoFwN4sxT2M5B_JzlKLwCgcbtWLSag",
//       "cache-control": "no-cache",
//       pragma: "no-cache",
//       "sec-ch-ua":
//         '"Chromium";v="112", "Google Chrome";v="112", "Not:A-Brand";v="99"',
//       "sec-ch-ua-mobile": "?0",
//       "sec-ch-ua-platform": '"macOS"',
//       "sec-fetch-dest": "empty",
//       "sec-fetch-mode": "cors",
//       "sec-fetch-site": "same-origin",
//       "x-debug-options": "bugReporterEnabled",
//       "x-discord-locale": "en-US",
//       "x-super-properties":
//         "eyJvcyI6Ik1hYyBPUyBYIiwiYnJvd3NlciI6IkNocm9tZSIsImRldmljZSI6IiIsInN5c3RlbV9sb2NhbGUiOiJlbi1VUyIsImJyb3dzZXJfdXNlcl9hZ2VudCI6Ik1vemlsbGEvNS4wIChNYWNpbnRvc2g7IEludGVsIE1hYyBPUyBYIDEwXzE1XzcpIEFwcGxlV2ViS2l0LzUzNy4zNiAoS0hUTUwsIGxpa2UgR2Vja28pIENocm9tZS8xMTIuMC4wLjAgU2FmYXJpLzUzNy4zNiIsImJyb3dzZXJfdmVyc2lvbiI6IjExMi4wLjAuMCIsIm9zX3ZlcnNpb24iOiIxMC4xNS43IiwicmVmZXJyZXIiOiJodHRwczovL3d3dy5yZWRkaXQuY29tLyIsInJlZmVycmluZ19kb21haW4iOiJ3d3cucmVkZGl0LmNvbSIsInJlZmVycmVyX2N1cnJlbnQiOiIiLCJyZWZlcnJpbmdfZG9tYWluX2N1cnJlbnQiOiIiLCJyZWxlYXNlX2NoYW5uZWwiOiJzdGFibGUiLCJjbGllbnRfYnVpbGRfbnVtYmVyIjoxOTM5MDYsImNsaWVudF9ldmVudF9zb3VyY2UiOm51bGwsImRlc2lnbl9pZCI6MH0=",
//       cookie:
//         "__dcfduid=3e831f60c9ce11edb227979fb32d9749; __sdcfduid=3e831f61c9ce11edb227979fb32d97498d7d08251da2e2567d1d5f24a627e648649a616bbaeb1ab87a2e952816eed616; _gcl_au=1.1.397408176.1680999677; _gid=GA1.2.512355361.1682820909; locale=en-US; __cfruid=05c4b0ace9bd881726e9de88d69372d524ae690e-1682823370; OptanonConsent=isIABGlobal=false&datestamp=Sun+Apr+30+2023+03%3A25%3A26+GMT-0400+(Eastern+Daylight+Time)&version=6.33.0&hosts=&landingPath=NotLandingPage&groups=C0001%3A1%2CC0002%3A1%2CC0003%3A1&AwaitingReconsent=false; _ga=GA1.1.1447167513.1679762349; _ga_Q149DFWHT7=GS1.1.1682839526.5.0.1682839532.0.0.0",
//       Referer:
//         "https://discord.com/channels/555456113663934474/1102078723357945957",
//       "Referrer-Policy": "strict-origin-when-cross-origin",
//     },
//     body: null,
//     method: "GET",
//   }
// );
