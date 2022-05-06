const express = require("express");
const session = require("express-session");
const app = express();
app.use(express.json());
const fs = require("fs");
const mysql = require("mysql2");

app.use("/js", express.static("./app/js"));
app.use("/css", express.static("./app/css"));
app.use("/img", express.static("./app/img"));

app.use(session({
    secret: "CaleMakarIsCool",
    name: "2800BBY29",
    resave: false,
    saveUninitialized: true
}));

app.get("/", function (req, res) {
    if (req.session.loggedIn) {
        if (req.session.admin) {
            // redirect to admin page
            res.redirect(`/admin/${req.session.user_name}`);
            console.log("Logged In.");
        } else {
            res.redirect(`/profile/${req.session.user_name}`);
            console.log("Logged In.");
        }
    } else {
        let doc = fs.readFileSync("./app/html/main.html", "utf8");
        res.set("Server", "TechToTheMoon Engine");
        res.set("X-Powered-By", "MoonPC");
        res.send(doc);
    }
});

app.get("/profile/:user_name", function (req, res) {
    if (req.session.loggedIn && req.session.user_name === req.params.user_name) {
        // TODO: create profile html page
        // and then replace main with profile
        let doc = fs.readFileSync("./app/html/main.html", "utf8");
        res.send(doc);
    } else {
        res.redirect('/');
    }
});

app.get("/admin/:user_name", function (req, res) {
    if (req.session.loggedIn && req.session.admin && req.session.user_name === req.params.user_name) {
        // TODO: create admin html page
        // and then replace main with admin
        let doc = fs.readFileSync("./app/html/main.html", "utf8");
        res.send(doc);
    } else {
        res.redirect('/');
    }
});

app.post("/login", function (req, res) {
    res.setHeader("Content-Type", "application/json");
    const username = req.body.user_name;
    const pwd = req.body.password;
    const connection = mysql.createConnection({
        host: '127.0.0.1',
        port: 3306,
        user: 'root',
        password: 'comp1537',
        database: 'techtothemoon'
    });
    connection.connect(function (err) {
        if (err) {
            return console.error('error: ' + err);
        }
    });
    connection.execute(
        "SELECT * FROM 2800_202210_BBY29_user WHERE 2800_202210_BBY29_user.user_name = ? AND 2800_202210_BBY29_user.password = ?",
        [username, pwd],
        function (error, results, fields) {
            if (error) {
                console.log(error);
                res.sendStatus(500);
            } else {
                if (results.length === 1) {
                    console.log('test');
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
                        admin: results[0].admin
                    };
                    res.send(resObj);
                } else {
                    res.sendStatus(401);
                    console.log('test');
                }
            }
            connection.end();
        }
    );
});

app.get("/users", function (req, res) {
    const connection = mysql.createConnection({
        host: '127.0.0.1',
        port: 3306,
        user: 'root',
        password: 'comp1537',
        database: 'techtothemoon'
    });
    connection.connect(function (err) {
        if (err) {
            res.send(err);
            return console.error('error: ' + err);
        }
    });
    connection.execute(
        "SELECT * FROM 2800_202210_BBY29_user",
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
            connection.end();
        }
    );
});

// Gabriel's Logout code
app.post("/logout", function (req, res) {

    if (req.session) {
        req.session.destroy(function (error) {
            if (error) {
                res.status(400).send("Unable to log out") //Can Change This Message If We Want
            } else {
                res.sendStatus(200);
            }
        });
    }
});

app.post('/add-user', function (req, res) {
    res.setHeader('Content-Type', 'application/json');

    console.log("userName", req.body.user_name);
    console.log("firstName", req.body.first_name);
    console.log("lastName", req.body.last_name);
    console.log("Email", req.body.email);
    console.log("phoneNumber", req.body.phone_number);
    console.log("Password", req.body.password);

    let connection = mysql.createConnection({
        host: '127.0.0.1',
        port: 3306,
        user: 'root',
        password: 'comp1537',
        database: 'techtothemoon'
    });
    connection.connect();
    // TO PREVENT SQL INJECTION, DO THIS:
    // (FROM https://www.npmjs.com/package/mysql#escaping-query-values)
    connection.query('INSERT INTO 2800_202210_BBY29_user (user_name, first_name, last_name, email, phone_number, password) values (?, ?, ?, ?, ?, ?)',
        [req.body.user_name, req.body.first_name, req.body.last_name, req.body.email, req.body.phone_number, req.body.password],
        function (error, results, fields) {
            if (error) {
                console.log(error);
            }
            //console.log('Rows returned are: ', results);
            res.send({
                status: "success",
                msg: "Record added."
            });

        });
    connection.end();

});

let port = 8000;
app.listen(port, function () {
    console.log("This project is served on port " + port + ".");
});