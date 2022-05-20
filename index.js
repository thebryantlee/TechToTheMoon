const express = require("express");
const session = require("express-session");
const app = express();
app.use(express.json());
const fs = require("fs");
const mysql = require("mysql2");
const crypto = require("crypto");

const puppeteer = require("puppeteer");
require("dotenv").config();

// Typically salt should be added by process.env but for purpose of application
// we have hard coded it
const salt = "VEhJU0lTU0FMVA==";
// Large parts of this code was adapted from COMP 1537 Assignment 6 by Bryant Lee,
// and updated to fit the needs of our app for COMP 2800 and 2537.

app.use("/js", express.static("./js"));
app.use("/css", express.static("./css"));
app.use("/img", express.static("./img"));
app.use("/fonts", express.static("./fonts"));

const is_heroku = process.env.IS_HEROKU || false;

const dbConfigHeroku = {
  host: "ebh2y8tqym512wqs.cbetxkdyhwsb.us-east-1.rds.amazonaws.com",
  port: 3306,
  user: "qp4pykpoi4im9ma3",
  password: "f3e5453kwi5dj8z8",
  database: "vuj5jsaqhkrllnp5",
  multipleStatements: false,
};

const dbConfigLocal = {
  host: "localhost",
  user: "root",
  password: "",
  database: "COMP2800",
  multipleStatements: false,
};

if (is_heroku) {
  var connection = mysql.createPool(dbConfigHeroku);
} else {
  var connection = mysql.createPool(dbConfigLocal);
}

app.use(
  session({
    secret: "CaleMakarIsCool",
    name: "2800BBY29",
    resave: false,
    saveUninitialized: true,
  })
);

app.get("/", function (req, res) {
  if (req.session.loggedIn) {
    if (req.session.admin) {
      // redirect to admin page
      res.redirect(`/profile/${req.session.user_name}`);
    } else {
      res.redirect(`/profile/${req.session.user_name}`);
    }
  } else {
    let doc = fs.readFileSync("./landing.html", "utf8");
    res.set("Server", "TechToTheMoon Engine");
    res.set("X-Powered-By", "MoonPC");
    res.send(doc);
  }
});

app.get("/about", function (req, res) {
  let doc = fs.readFileSync("./about.html", "utf8");
  res.set("Server", "TechToTheMoon Engine");
  res.set("X-Powered-By", "MoonPC");
  res.send(doc);
});

app.get("/signin", function (req, res) {
  if (req.session.loggedIn) {
    if (req.session.admin) {
      // redirect to admin page
      res.redirect(`/profile/${req.session.user_name}`);
    } else {
      res.redirect(`/profile/${req.session.user_name}`);
    }
  } else {
    let doc = fs.readFileSync("./index.html", "utf8");
    res.set("Server", "TechToTheMoon Engine");
    res.set("X-Powered-By", "MoonPC");
    res.send(doc);
  }
});

app.get("/profile/:user_name", function (req, res) {
  if (
    req.session.loggedIn &&
    req.session.admin &&
    req.session.user_name === req.params.user_name
  ) {
    // TODO: create admin html page
    // and then replace main with admin
    let doc = fs.readFileSync("./admin.html", "utf8");
    res.send(doc);
  } else if (
    req.session.loggedIn &&
    req.session.user_name === req.params.user_name
  ) {
    let doc = fs.readFileSync("./template.html", "utf8");
    res.send(doc);
  } else {
    res.redirect("/");
  }
});

app.post("/login", function (req, res) {
  res.setHeader("Content-Type", "application/json");
  const username = req.body.user_name;
  // Note: User passwords must be created through sign up
  const pwd = hash(req.body.password + salt);

  connection.execute(
    "SELECT * FROM BBY29_user WHERE BBY29_user.user_name = ? AND BBY29_user.password = ?",
    [username, pwd],
    function (error, results, fields) {
      if (error) {
        console.log(error);
        res.sendStatus(500);
      } else {
        if (results.length === 1) {
          req.session.admin = results[0].admin;
          req.session.user_name = results[0].user_name;
          req.session.loggedIn = true;
          req.session.email = results[0].email;
          req.session.name = `${results[0].first_name} ${results[0].last_name}`;
          req.session.user_ID = results[0].ID;
          req.session.save(function (err) {
            console.log("Session saved.");
          });
          const resObj = {
            user_name: results[0].user_name,
            first_name: results[0].first_name,
            admin: results[0].admin,
          };
          res.send(resObj);
        } else {
          res.sendStatus(401);
        }
      }
    }
  );
});

app.get("/users", function (req, res) {
  connection.execute(
    "SELECT * FROM BBY29_user WHERE ID <> " + req.session.user_ID,
    function (error, results, fields) {
      if (error) {
        console.log(error);
        res.sendStatus(500);
      } else {
        if (results.length > 0) {
          res.send(results);
        } else {
          res.sendStatus(400);
        }
      }
    }
  );
});

// Gabriel's code (start)
app.post("/logout", function (req, res) {
  if (req.session) {
    req.session.destroy(function (error) {
      if (error) {
        res.status(400).send("Unable to log out");
      } else {
        res.sendStatus(200);
      }
    });
  }
});

app.post("/add_user", function (req, res) {
  res.setHeader("Content-Type", "application/json");

  console.log("userName", req.body.user_name);
  console.log("firstName", req.body.first_name);
  console.log("lastName", req.body.last_name);
  console.log("Email", req.body.email);
  console.log("phoneNumber", req.body.phone_number);
  console.log("Password", req.body.password);

  // Bryant - password hashing
  const pwhash = hash(req.body.password + salt);

  // TO PREVENT SQL INJECTION, DO THIS:
  // (FROM https://www.npmjs.com/package/mysql#escaping-query-values)
  connection.query(
    "INSERT INTO BBY29_user (user_name, first_name, last_name, email, phone_number, admin, password, avatar_path) values (?, ?, ?, ?, ?, ?, ?, ?)",
    [
      req.body.user_name,
      req.body.first_name,
      req.body.last_name,
      req.body.email,
      req.body.phone_number,
      0,
      pwhash,
      0,
    ],
    function (error, results, fields) {
      if (error) {
        console.log(error);
      }
      res.send({
        status: "success",
        msg: "Record added.",
      });
    }
  );
});

app.post("/update-user", function (req, res) {
  res.setHeader("Content-Type", "application/json");
  const column = req.body.column;
  const value = req.body.value;
  const id = req.body.id;
  //With password
  connection.execute(
    "UPDATE BBY29_user SET " + column + " = ? WHERE ID = ?",
    [value, id],
    function (error, results, fields) {
      if (error) {
        console.log(error);
        res.sendStatus(500);
      } else {
        res.send({
          status: "success",
          msg: "Record added.",
        });
      }
    }
  );
});

app.post("/delete_user", function (req, res) {
  res.setHeader("Content-Type", "application/json");
  const id = req.body.id;

  connection.execute(
    "DELETE FROM BBY29_user WHERE ID = ?",
    [id],
    function (error, results, fields) {
      if (error) {
        console.log(error);
        res.sendStatus(500);
      } else {
        res.send({
          status: "success",
          msg: "Record added.",
        });
      }
    }
  );
});

app.post("/add_item", function (req, res) {
  res.setHeader("Content-Type", "application/json");
  const user = req.session.user_ID;
  const url = req.body.url;
  console.log(user);

  connection.execute(
    "INSERT INTO BBY29_item_tracker (item_user_ID, url, title, priceStr, imgUrl) values (?, ?, ?, ?, ?)",
    [user, url, null, null, null],
    function (error, results, fields) {
      if (error) {
        console.log(error);
      }
      res.send({
        status: "success",
        msg: "Record added.",
      });
    }
  );
});

app.get("/get_items", function (req, res) {
  connection.execute(
    "SELECT * FROM BBY29_item_tracker WHERE item_user_ID = " +
      req.session.user_ID,
    function (error, results, fields) {
      if (error) {
        console.log(error);
        res.sendStatus(500);
      } else {
        if (results.length > 0) {
          res.send(results);
        } else {
          res.send(results);
        }
      }
    }
  );
});

app.post("/get_item_details", async function (req, res) {
  const item_url = req.body.url;
  var title;
  var priceStr;
  var imgUrl;
  try {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(item_url, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });
    try {
      await page.waitForSelector("#productTitle", { visible: true });
      await page.waitForSelector(".a-offscreen", { visible: true });
    } catch (error) {
      console.log(error);
      res.sendStatus(500);
      return;
    }

    const result = await page.evaluate(() => {
      return [
        JSON.stringify(document.getElementById("productTitle").innerHTML),
        JSON.stringify(document.getElementById("landingImage").src),
        JSON.stringify(
          document.getElementsByClassName("a-offscreen")[0].innerHTML
        ),
      ];
    });
    [title] = [JSON.parse(result[0])];
    [priceStr] = [JSON.parse(result[2])];
    [imgUrl] = [JSON.parse(result[1])];
    console.log({ title });
    console.log({ priceStr });
    console.log({ imgUrl });
    browser.close();
  } catch (error) {
    console.log(error);
  }

  connection.execute(
    "UPDATE BBY29_item_tracker SET title = ?, priceStr = ?, imgUrl = ? WHERE ID = " +
      req.body.id,
    [title, priceStr, imgUrl],
    function (error, results, fields) {
      if (error) {
        console.log(error);
        res.sendStatus(500);
      } else {
        res.send({
          status: "success",
          msg: "Record added.",
        });
      }
    }
  );
});

app.post("/delete_item", function (req, res) {
  res.setHeader("Content-Type", "application/json");
  const item_id = req.body.id;

  connection.execute(
    "DELETE FROM BBY29_item_tracker WHERE ID = ?",
    [item_id],
    function (error, results, fields) {
      if (error) {
        console.log(error);
        res.sendStatus(500);
      } else {
        res.send({
          status: "success",
          msg: "Record added.",
        });
      }
    }
  );
});
// Gabriel's code (end)

function hash(pw) {
  // implement hashing
  return crypto.createHash("md5").update(pw).digest("base64");
}

// Jacob's code (Beginning)
app.post("/passwordCheck", function (req, res) {
  res.setHeader("Content-Type", "application/json");
  const user = req.session.user_name;
  const pass = hash(req.body.password + salt);

  connection.execute(
    "SELECT * FROM BBY29_user WHERE BBY29_user.user_name = ? AND BBY29_user.password = ?",
    [user, pass],
    function (error, results, fields) {
      if (error) {
        console.log(error);
        res.sendStatus(500);
      } else {
        if (results.length === 1) {
          res.send(results);
        } else {
          res.sendStatus(400);
        }
      }
    }
  );
});

app.post("/updateData", function (req, res) {
  res.setHeader("Content-Type", "application/json");
  const username = req.body.user_name;
  const fName = req.body.first_name;
  const lName = req.body.last_name;
  const em = req.body.email;
  const pNum = req.body.phone_number;
  const avatar = req.body.avatar_path;
  const pass = req.body.password;

  //With password
  if (pass) {
    connection.execute(
      "UPDATE BBY29_user SET user_name = ?, first_name = ?, last_name = ?, email = ?, phone_number = ?, password = ?, avatar_path = ? WHERE ID = ?",
      [username, fName, lName, em, pNum, pass, avatar, req.session.user_ID],
      function (error, results, fields) {
        if (error) {
          console.log(error);
          res.sendStatus(500);
        } else {
          req.session.user_name = username;
          req.session.email = em;
          req.session.name = fName + " " + lName;
          req.session.save(function (err) {
            console.log("Session saved.");
          });
          res.send({
            status: "success",
            msg: "Record added.",
          });
        }
      }
    );
  } else {
    connection.execute(
      "UPDATE BBY29_user SET user_name = ?, first_name = ?, last_name = ?, email = ?, phone_number = ?, avatar_path = ? WHERE ID = ?",
      [username, fName, lName, em, pNum, avatar, req.session.user_ID],
      function (error, results, fields) {
        if (error) {
          console.log(error);
          res.sendStatus(500);
        } else {
          req.session.user_name = username;
          req.session.email = em;
          req.session.name = fName + " " + lName;
          req.session.save(function (err) {
            console.log("Session saved.");
          });
          res.send({
            status: "success",
            msg: "Record added.",
          });
        }
      }
    );
  }
});

app.get("/account", function (req, res) {
  if (req.session.loggedIn) {
    // Redirect to account page
    res.redirect(`/account/${req.session.user_name}`);
    console.log("Redirected to account page.");
  } else {
    res.redirect("/");
  }
});

app.get("/account/:user_name", function (req, res) {
  if (req.session.loggedIn && req.session.user_name === req.params.user_name) {
    let doc = fs.readFileSync("./account.html", "utf8");
    res.send(doc);
  } else if (req.session.loggedIn) {
    res.redirect("/account");
  } else {
    res.redirect("/");
  }
});

app.get("/tracker", function (req, res) {
  if (req.session.loggedIn) {
    // Redirect to account page
    res.redirect(`/tracker/${req.session.user_name}`);
    console.log("Redirected to tracking page.");
  } else {
    res.redirect("/");
  }
});

app.get("/tracker/:user_name", function (req, res) {
  if (req.session.loggedIn && req.session.user_name === req.params.user_name) {
    let doc = fs.readFileSync("./tracker.html", "utf8");
    res.send(doc);
  } else if (req.session.loggedIn) {
    res.redirect("/tracker");
  } else {
    res.redirect("/");
  }
});

app.get("/current_user", function (req, res) {
  connection.execute(
    "SELECT * FROM BBY29_user WHERE BBY29_user.user_name = ?",
    [req.session.user_name],
    function (error, results, fields) {
      if (error) {
        console.log(error);
        res.sendStatus(500);
      } else {
        if (results.length === 1) {
          res.send(results);
        } else {
          res.sendStatus(400);
        }
      }
    }
  );
});

app.post("/uploadNews", function (req, res) {
  res.setHeader("Content-Type", "application/json");
  const user = req.session.user_ID;
  const title = req.body.title;
  const datetime = req.body.post_datetime;
  const categ = req.body.category;
  const article = req.body.full_article;

  //With password
  connection.execute(
    "INSERT INTO news_post (user_id, title, post_datetime, category, full_article) values (?, ?, ?, ?, ?)",
    [user, title, datetime, categ, article],
    function (error, results, fields) {
      if (error) {
        console.log(error);
        res.sendStatus(500);
      } else {
        res.send({
          status: "success",
          msg: "Record added.",
        });
      }
    }
  );
});

app.get("/news", function (req, res) {
  if (req.session.loggedIn) {
    // Redirect to account page
    res.redirect(`/news/${req.session.user_name}`);
    console.log("Redirected to news page.");
  } else {
    res.redirect("/");
  }
});

app.get("/news/:user_name", function (req, res) {
  if (req.session.loggedIn && req.session.user_name === req.params.user_name) {
    let doc = fs.readFileSync("./news.html", "utf8");
    res.send(doc);
  } else if (req.session.loggedIn) {
    res.redirect("/news");
  } else {
    res.redirect("/");
  }
});

app.get("/getNews", function (req, res) {
  res.setHeader("Content-Type", "application/json");
  connection.execute(
    "SELECT * FROM news_post ORDER BY post_datetime DESC",
    function (error, results, fields) {
      if (error) {
        console.log(error);
        res.sendStatus(500);
      } else {
        if (results.length > 0) {
          res.send(results);
        } else {
          res.sendStatus(400);
        }
      }
    }
  );
});

app.get("/article/:articleID", function (req, res) {
  connection.execute(
    "SELECT * FROM news_post WHERE news_post.ID = " + req.params.articleID,
    function (error, results, fields) {
      if (error) {
        console.log(error);
        res.sendStatus(500);
      } else {
        if (results.length === 1) {
          res.send(results);
        } else {
          res.sendStatus(400);
        }
      }
    }
  );
});

app.get("/get_user/:userID", function (req, res) {
  connection.execute(
    "SELECT * FROM BBY29_user WHERE BBY29_user.ID = " + req.params.userID,
    function (error, results, fields) {
      if (error) {
        console.log(error);
        res.sendStatus(500);
      } else {
        if (results.length === 1) {
          res.send(results);
        } else {
          res.sendStatus(400);
        }
      }
    }
  );
});

app.post("/delete_news", function (req, res) {
  res.setHeader("Content-Type", "application/json");
  const id = req.body.id;

  connection.execute(
    "DELETE FROM news_post WHERE ID = ?",
    [id],
    function (error, results, fields) {
      if (error) {
        console.log(error);
        res.sendStatus(500);
      } else {
        res.send({
          status: "success",
          msg: "Record deleted.",
        });
      }
    }
  );
});

app.get("/recent_news", function (req, res) {
  res.setHeader("Content-Type", "application/json");
  connection.execute(
    "SELECT * FROM news_post ORDER BY post_datetime DESC LIMIT 3",
    function (error, results, fields) {
      if (error) {
        console.log(error);
        res.sendStatus(500);
      } else {
        if (results.length > 0) {
          res.send(results);
        } else {
          res.sendStatus(400);
        }
      }
    }
  );
});

// Jacob's code (end)
// Heroku Dynamically assigns port via process.env.PORT.

app.put("/updateItem5", function (req, res) {
  const item5 = req.body.quantity;
  connection.execute(
    "UPDATE BBY29_user SET item5 = ? WHERE ID = ?",
    [item5, req.session.user_ID],
    function (error, results, fields) {
      if (error) {
        console.log(error);
        res.sendStatus(500);
      } else {
        res.send({
          status: "success",
          msg: "Record added.",
        });
      }
    }
  );
});

app.put("/updateItem6", function (req, res) {
  const item6 = req.body.quantity;
  connection.execute(
    "UPDATE BBY29_user SET item6 = ? WHERE ID = ?",
    [item6, req.session.user_ID],
    function (error, results, fields) {
      if (error) {
        console.log(error);
        res.sendStatus(500);
      } else {
        res.send({
          status: "success",
          msg: "Record added.",
        });
      }
    }
  );
});

app.put("/updateItem1", function (req, res) {
  const item1 = req.body.quantity;
  connection.execute(
    "UPDATE BBY29_user SET item1 = ? WHERE ID = ?",
    [item1, req.session.user_ID],
    function (error, results, fields) {
      if (error) {
        console.log(error);
        res.sendStatus(500);
      } else {
        res.send({
          status: "success",
          msg: "Record added.",
        });
      }
    }
  );
});

app.put("/updateItem2", function (req, res) {
  const item2 = req.body.quantity;
  connection.execute(
    "UPDATE BBY29_user SET item2 = ? WHERE ID = ?",
    [item2, req.session.user_ID],
    function (error, results, fields) {
      if (error) {
        console.log(error);
        res.sendStatus(500);
      } else {
        res.send({
          status: "success",
          msg: "Record added.",
        });
      }
    }
  );
});

app.put("/updateItem3", function (req, res) {
  const item3 = req.body.quantity;
  connection.execute(
    "UPDATE BBY29_user SET item3 = ? WHERE ID = ?",
    [item3, req.session.user_ID],
    function (error, results, fields) {
      if (error) {
        console.log(error);
        res.sendStatus(500);
      } else {
        res.send({
          status: "success",
          msg: "Record added.",
        });
      }
    }
  );
});

app.put("/updateItem4", function (req, res) {
  const item4 = req.body.quantity;
  connection.execute(
    "UPDATE BBY29_user SET item4 = ? WHERE ID = ?",
    [item4, req.session.user_ID],
    function (error, results, fields) {
      if (error) {
        console.log(error);
        res.sendStatus(500);
      } else {
        res.send({
          status: "success",
          msg: "Record added.",
        });
      }
    }
  );
});

app.put("/updateCheckout", function (req, res) {
  // what to put for const
  const checkedout = req.body.quantity;
  connection.execute(
    "UPDATE BBY29_user SET checkedout = ? WHERE ID = ?",
    [item4, req.session.user_ID],
    function (error, results, fields) {
      if (error) {
        console.log(error);
        res.sendStatus(500);
      } else {
        res.send({
          status: "success",
          msg: "Record added.",
        });
      }
    }
  );
});

// App.get function to get the current cart
app.get("/currentCart", function (req, res) {
  connection.execute(
    "SELECT item5, item6, item1, item2, item3, item4 FROM BBY29_user WHERE ID = ?",
    [req.session.user_ID],
    function (error, results, fields) {
      if (error) {
        console.log(error);
        res.sendStatus(500);
      } else {
        if (results.length === 1) {
          res.send(results);
        } else {
          res.sendStatus(400);
        }
      }
    }
  );
});

// App.get function to get checkout
app.get("/currentCheckout", function (req, res) {
  connection.execute(
    "SELECT checkedout FROM BBY29_user WHERE ID = ?",
    [req.session.user_ID],
    function (error, results, fields) {
      if (error) {
        console.log(error);
        res.sendStatus(500);
      } else {
        if (results.length === 1) {
          res.send(results);
        } else {
          res.sendStatus(400);
        }
      }
    }
  );
});

app.get("/shop", function (req, res) {
  if (req.session.loggedIn) {
    let doc = fs.readFileSync("shop.html", "utf8");
    res.send(doc);
  } else if (req.session.loggedIn) {
    res.redirect("/account");
  } else {
    res.redirect("/");
  }
});

app.get("/summary", function (req, res) {
  if (req.session.loggedIn) {
    let doc = fs.readFileSync("shop-summary.html", "utf8");
    res.send(doc);
  } else if (req.session.loggedIn) {
    res.redirect("/account");
  } else {
    res.redirect("/");
  }
});

app.get("/checkout", function (req, res) {
  if (req.session.loggedIn) {
    let doc = fs.readFileSync("shop-confirm.html", "utf8");
    res.send(doc);
  } else if (req.session.loggedIn) {
    res.redirect("/account");
  } else {
    res.redirect("/");
  }
});

// When running locally process.env.PORT is undefined so runs on port 8000
app.listen(process.env.PORT || 8000);
