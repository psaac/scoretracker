import { makeQuery } from "./query.js";
import { promises as fs, readFileSync, writeFileSync } from "fs";

/*
const workspaces = JSON.parse(
  await makeQuery(`query {
        workspaces(page: 1, limit: 1000) {
        id
        name
        kind
        state
    }
    }`)
);

console.log(`Found ${workspaces.data.workspaces.length} workspaces`);

let csv =
  "Workspace Id;Workspace Name;Board Id; Board Name;Items Count;Last updated;Owners";
let progress = -1;
let index = 0;
for (const workspace of workspaces.data.workspaces) {
  const boards = JSON.parse(
    await makeQuery(`query {
        boards(workspace_ids: [${workspace.id}], limit: 1000, page: 1, state: active) {
        id
        name        
        type
        owners {            
            name
        }
        # items_count
    }
    }`)
  );
  try {
    for (const board of boards.data.boards) {
      if (board.type === "board") {
        // For each board, get item count and last_updated info
        const boardInfo = JSON.parse(
          await makeQuery(`query {
              boards(ids: ${board.id}) {
              updated_at
              items_count
          }
          }`)
        );
        csv += `\n${workspace.id};${workspace.name};${board.id};${board.name};${
          boardInfo.data.boards[0].items_count
        };${boardInfo.data.boards[0].updated_at};${board.owners
          .map((owner) => owner.name)
          .join(",")}`;
      }
    }
  } catch (e) {
    console.error(
      `Cannot parse ${JSON.stringify(
        boards
      )}, with error ${e}. Workspace id : ${workspace.id}`
    );
  }
  const newProgress = Math.round(
    (index / workspaces.data.workspaces.length) * 100
  );
  if (newProgress !== progress)
    console.log(`Fetching workspaces ${newProgress}%`);
  progress = newProgress;
  index++;
}
await fs.writeFile("data/allBoards.csv", csv, "utf-8");
console.log(`CSV saved !`);
*/

const boards = JSON.parse(
  await makeQuery(`query {
        boards(workspace_ids: [2524481], limit: 1000, page: 1, state: active) {
        id
        name        
        type
        owners {            
            name
        }
        # items_count
    }
    }`)
);
console.log(JSON.stringify(boards));
/*
import { convertToADF } from "./adf.js";
import { fileTypeFromFile } from "file-type";
import { imageSizeFromFile } from "image-size/fromFile";
const html = `<body>
<ul>
  <li>
    les NOBs
    <span
      style="color: rgb(255, 203, 0)"
      data-redactor-style-cache="color: rgb(255, 203, 0);"
      ><span
        style="color: rgb(0, 133, 255)"
        data-redactor-style-cache="color: rgb(0, 133, 255);"
        ><strong
          ><span
            style="color: rgb(0, 113, 217)"
            data-redactor-style-cache="color: rgb(0, 113, 217);"
            >(hors CNJ)</span
          ></strong
        ></span
      ></span
    >,
  </li>
  <li>la date de de création de compte,</li>
  <li>le pays de souscription</li>
  <li>la dernière RF déclarée</li>
  <li>le trigger (RF ou N°) ayant permeis l'identification du client</li>
</ul>
</body>`;

const assets = [
  {
    id: "74182043",
    file: "data/1137292274/assets/74182043.png",
  },
  {
    id: "82084198",
    file: "data/1137292274/assets/82084198.csv",
  },
  {
    id: "82084231",
    file: "data/1137292274/assets/82084231.csv",
  },
  {
    id: "82084256",
    file: "data/1137292274/assets/82084256.csv",
  },
  {
    id: "82213149",
    file: "data/1137292274/assets/82213149.png",
  },
  {
    id: "82214435",
    file: "data/1137292274/assets/82214435.png",
  },
  {
    id: "82214990",
    file: "data/1137292274/assets/82214990.png",
  },
  // {
  //   id: "75032184",
  //   file: "data/1137292274/assets/75032184.png",
  // },
  // {
  //   id: "74864287",
  //   file: "data/1137292274/assets/74864287.png",
  // },
  // {
  //   id: "74473709",
  //   file: "data/1137292274/assets/74473709.csv",
  // },
  // {
  //   id: "74295242",
  //   file: "data/1137292274/assets/74295242.csv",
  // },
  // {
  //   id: "73662649",
  //   file: "data/1137292274/assets/73662649.png",
  // },
  // {
  //   id: "73429128",
  //   file: "data/1137292274/assets/73429128.png",
  // },
  // {
  //   id: "71899387",
  //   file: "data/1137292274/assets/71899387.png",
  // },
  // {
  //   id: "70257754",
  //   file: "data/1137292274/assets/70257754.png",
  // },
  // {
  //   id: "70304550",
  //   file: "data/1137292274/assets/70304550.png",
  // },
  // {
  //   id: "68231488",
  //   file: "data/1137292274/assets/68231488.png",
  // },
  // {
  //   id: "67350004",
  //   file: "data/1137292274/assets/67350004.png",
  // },
  // {
  //   id: "67357184",
  //   file: "data/1137292274/assets/67357184.png",
  // },
  // {
  //   id: "63896660",
  //   file: "data/1137292274/assets/63896660.png",
  // },
];

let assetsMap = new Map();
await Promise.all(
  assets.map(async (asset) => {
    const fileName = asset.file.split("/").pop().split(".")[0];

    const type = await fileTypeFromFile(asset.file);
    let attrs = { isImage: type?.mime.startsWith("image/") };
    if (attrs.isImage) {
      attrs = { ...attrs, ...(await imageSizeFromFile(asset.file)) };
    }

    assetsMap.set(fileName, attrs);
  })
);

const result = convertToADF(html, assetsMap);
// console.log("HTML");
// console.log(JSON.stringify(result.html));
// console.log("ADF");
// console.log(JSON.stringify(result.adf));
writeFileSync("./tmp/test.adf", JSON.stringify(result.adf, null, 2));

// Validate schema
import { Validator } from "jsonschema";
var v = new Validator();
var schema = JSON.parse(readFileSync("adf_schema.json", "utf8"));
const validateResult = v.validate(result.adf, schema);
for (const error of validateResult.errors) {
  console.error(
    `Error on : ${JSON.stringify(result.adf.content[error.path[1]])}`
  );
}
if (validateResult.errors.length === 0) console.log("ADF convert success");

// import { downloadFile } from "./query.js";

// await downloadFile(
//   "https://prod-euc1-files-monday-com.s3.eu-central-1.amazonaws.com/10799996/resources/60440991/image.png?response-content-disposition=attachment&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIA4MPVJMFXJ4YPAV7U%2F20251023%2Feu-central-1%2Fs3%2Faws4_request&X-Amz-Date=20251023T150535Z&X-Amz-Expires=3600&X-Amz-SignedHeaders=host&X-Amz-Signature=c103c029905f5a39dc3a3bd2235082a2641f3d53ed32248d80670e66a4fbc247",
//   "60440991.png",
//   1231508591,
//   true
// );
*/
