const express = require('express');
const app = express();
const path = require('path')
const dbConection = require('./config/db.js')
const usermodel = require('./models/user');
const postmodel = require('./models/post')
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const multercongig = require('./config/multerConfig')
const dotenv = require('dotenv')

dotenv.config();
app.set("view engine", "ejs");
app.set('views', path.join(__dirname, 'views'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }))
app.use(express.static(path.join(__dirname, "public")));
app.use(cookieParser());

dbConection();
app.get('/', (req, res) => {
    res.render('index');
});

app.post("/register", async (req, res) => {
    try {
        let { name, username, email, password, age } = req.body;

        let user = await usermodel.findOne({ email });
        if (user) return res.status(500).send("User already registered!");

        bcrypt.genSalt(10, (err, salt) => {
            bcrypt.hash(password, salt, async (err, hash) => {
                let user = await usermodel.create({
                    name,
                    username,
                    email,
                    age,
                    password: hash
                })

                let token = jwt.sign({ email: email, userid: user._id }, process.env.JWT_SECRET);
                res.cookie("token", token);
                res.redirect('/profile');
            })
        })
    } catch (error) {
        console.error(error.message)
    }
})

app.get('/login', (req, res) => {
    res.render('login');
});

app.post("/login", async (req, res) => {
    let { email, password } = req.body;

    let user = await usermodel.findOne({ email });
    if (!user) return res.status(500).send("User NOT found!");

    bcrypt.compare(password, user.password, (err, result) => {
        if (result) {
            let token = jwt.sign({ email: email, userid: user._id }, process.env.JWT_SECRET);
            res.cookie("token", token);
            res.status(200).redirect("/profile")
        }
        else {
            res.redirect("/login");
        }
    })
})

app.get("/logout", (req, res) => {
    res.cookie("token", "");
    res.redirect("/login");
})

app.get("/profile", isLoggedIn, async (req, res) => {
    let user = await usermodel.findOne({ email: req.user.email }).populate("posts");

    res.render("profile", { user });
})

app.post("/post", isLoggedIn, async (req, res) => {
    let user = await usermodel.findOne({ email: req.user.email });
    let { content } = req.body

    let post = await postmodel.create({
        user: user._id,
        content
    })

    user.posts.push(post._id);
    await user.save();
    res.redirect("/profile");
})

app.get("/like/:id", isLoggedIn, async (req, res) => {
    let post = await postmodel.findOne({ _id: req.params.id }).populate("user");

    if (post.likes.indexOf(req.user.userid) == -1) {
        post.likes.push(req.user.userid);
    } else {
        post.likes.splice(req.user.userid, 1);
    }

    await post.save();
    res.redirect("/profile");
})

app.get("/edit/:id", isLoggedIn, async (req, res) => {
    let post = await postmodel.findOne({ _id: req.params.id });

    res.render("editPost", { post })
})

app.post("/update/:id", async (req, res) => {
    let post = await postmodel.findOneAndUpdate({ _id: req.params.id }, { content: req.body.content });
    res.redirect("/profile");
})

function isLoggedIn(req, res, next) {
    if (req.cookies.token == "") {
        res.redirect("/login");
    } else {
        let data = jwt.verify(req.cookies.token, process.env.JWT_SECRET);
        req.user = data;
    }
    next();
}

app.get("/upload/profilepic", isLoggedIn, (req, res) => {
    res.render("profilePic");
})

app.post("/upload", isLoggedIn, multercongig.single("profilePic"), async (req, res) => {
    let user = await usermodel.findOne({ email: req.user.email });

    user.profilePic = req.file.filename;
    await user.save();
    res.redirect("/profile");
})

app.get("/viewprofilepic", isLoggedIn, async (req, res) => {
    let user = await usermodel.findOne({ email: req.user.email });
    res.render("viewProfilePic", { user });
})

app.get("/remove/profilepic", isLoggedIn, async (req, res) => {
    let user = await usermodel.findOne({ email: req.user.email });

    user.profilePic = "defaultAvatar.jpg";
    await user.save();
    res.redirect("/profile");
})

const PORT = process.env.PORT;
app.listen(PORT, () => console.log(`server running on port ${PORT}`));