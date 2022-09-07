const express = require("express");
const app = express();
const dfff = require("dialogflow-fulfillment");
const axios = require("axios");
const fs = require("fs");
const port = 8015;

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.get("/", (req, res) => {
  res.send("Testing");
});

const dataProduk = "data.json";
const setDataProduk = function (sessions) {
  fs.writeFile(dataProduk, JSON.stringify(sessions), function (err) {
    if (err) {
      console.log(err);
    }
  });
};

const getDataProduk = function () {
  return JSON.parse(fs.readFileSync(dataProduk));
};

app.post("/add-produk", (req, res) => {
  const data = {
    namaProduk: req.body.namaProduk.toLowerCase(),
    harga1: req.body.harga1,
    harga3: req.body.harga3,
    harga12: req.body.harga12,
    link: req.body.link,
  };
  const savedProduk = getDataProduk();

  const produkIndex = savedProduk.findIndex(
    (p) => p.namaProduk == data.namaProduk
  );

  if (produkIndex == -1) {
    savedProduk.push(data);
    setDataProduk(savedProduk);
    return res.json({
      status: "success",
      message: "Data Berhasil di Tambahkan",
      data: data,
    });
  }

  return res.json({
    status: "error",
    message: "Data Produk Sudah Ada",
  });
});

app.post("/delete-produk", (req, res) => {
  const namaProduk = req.body.namaProduk.toLowerCase();
  const savedProduk = getDataProduk();
  const produkIndex = savedProduk.findIndex((p) => p.namaProduk == namaProduk);

  if (produkIndex != -1) {
    savedProduk.splice(produkIndex, 1);
    setDataProduk(savedProduk);

    return res.json({
      status: "success",
      message: "Data Berhasil di Hapus",
      data: namaProduk,
    });
  }

  return res.json({
    status: "error",
    message: "Data Gagal di Hapus",
  });
});

app.post("/get-produk", express.json(), (req, res) => {
  console.log(req.body.queryResult);
  const nameProduk =
    req.body.queryResult &&
    req.body.queryResult.parameters &&
    req.body.queryResult.parameters.produk
      ? req.body.queryResult.parameters.produk
      : "";
  if (nameProduk.length > 0) {
    const savedProduk = getDataProduk();
    const produk = savedProduk.find(
      (p) => p.namaProduk.toLowerCase() == nameProduk.toLowerCase()
    );

    if (produk) {
      return res.json({
        fulfillmentMessages: [
          {
            text: {
              text: [
                `produk ${nameProduk} ${produk.harga1} kak per pcs, ada harga spesial beli 3 jadi ${produk.harga3}/pcs, dan beli 12 jadi ${produk.harga12} 😊 kaka mau warna apa? 😊 untuk warna lengkapnya bisa liat di sini ya kak`,
              ],
            },
          },
          {
            payload: {
              richContent: [
                [
                  {
                    icon: {
                      color: "#FF9800",
                      type: "chevron_right",
                    },
                    event: {
                      name: "",
                    },
                    type: "button",
                    text: `Katalog warna ${nameProduk}`,
                    link: produk.link,
                  },
                ],
              ],
            },
          },
        ],
        source: "produk",
      });
    } else {
      return res.json({
        fulfillmentMessages: [
          {
            text: {
              text: [`produk belum tersedia kak. mohon maaf ya 😊`],
            },
          },
        ],
      });
    }
  } else {
    return res.json({
      fulfillmentMessages: [
        {
          text: {
            text: [`produk belum tersedia kak. mohon maaf ya 😊`],
          },
        },
      ],
    });
  }
});

app.post("/", express.json(), (req, res) => {
  const agent = new dfff.WebhookClient({
    request: req,
    response: res,
  });

  //    function produkTest(agent) {
  //     agent.add("testing aja");
  //    }

  function produk(agent) {
    async function getProduk() {
      axios
        .get(
          `https://hijabsyandana.com/wp-json/wc/v3/products?search=gosya&per_page=1`
        )
        .then((result) => {
          console.log(result.data);
        })
        .catch((error) => {
          console.log("Error status", error);
        });

      return;
    }

    getProduk();

    const customPayload = {
      richContent: [
        [
          {
            icon: {
              color: "#FF9800",
              type: "chevron_right",
            },
            event: {
              name: "",
            },
            type: "button",
            text: "Buka Shopee Syandana",
            link: "http://shopee.co.id/hijabsyandana",
          },
        ],
      ],
    };
    agent.add(
      new dfff.Payload(agent.UNSPECIFIED, customPayload, {
        sendAsMessage: true,
        rawPayload: true,
      })
    );
  }

  var intentMap = new Map();
  intentMap.set("produk", produk);

  agent.handleRequest(intentMap);
});

app.listen(port, () => console.log(`server start live at port ${port}`));
