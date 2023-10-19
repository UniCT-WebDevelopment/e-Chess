const db_conncection_f = require("./db");
const global = require("./config");
const models = require("./model");
const express = require("express");
var cors = require('cors');
const app = express();
const { createServer } = require("http");
const { Server } = require("socket.io");
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*"
    }
});

db_conncection_f();
app.use(express.urlencoded({ extent: false }));
app.use(express.json());
app.use(cors());

//all route
app.get("/getUsername/:username", async (req, res) => {
    const user = req.params;
    if (user) {
        const query = await models.find(user).exec();
        if (query.length > 0) { res.send(true).status(200); }
        else { res.send(false).status(200); }
    }
    else { res.send("bad request").status(400); }
});

app.get("/getScore/:username", async (req, res) => {
    const username = req.params;

    if (username) {
        const query = await models.find(username).select("score").exec();
        if (query.length > 0) {
            res.send(query).status(200);
        }
        else { res.send(false).status(200); }
    }
    else { res.send("bad request").status(400); }
});

/* route for set the score from frontend, for this reason disabled

app.get("/setScore/:username/:score", async (req, res) => {
    const user = req.params.username;

    const score = req.params.score;

    const player = { username: user };
    if (user) {
        await models.findOneAndUpdate({ username: user }, { score: score });
        res.send("update").status(200);
    }
    else {
        res.send("bad request").status(400);
    }
})*/

app.post("/insertUser", async (req, res) => {
    const user = req.body;
    if (user) {
        const user_instance = new models(user);
        await user_instance.save();
        res.send(true).status(200);
    }
    else {
        res.send("insertUser fail").status(400);
    }

});

app.post("/login", async (req, res) => {
    const user = req.body;
    if (user) {
        const users = await models.find(user).select("username password").exec();
        if (users.length > 0) { res.send(true).status(200) }
        else { res.send(false).status(400) }
    }
    else {
        res.send("login fail").status(400);
    }

});


//add the engine
const jsChessEngine = require('js-chess-engine');

//socket.io global var
var Arr_rooms = [];

//socket.io handler
io.on("connection", (socket) => {

    //connection handler
    socket.emit("connected");

    //send rooms to homepage
    socket.on("Send_rooms", () => {
        io.sockets.emit("send_arr", Arr_rooms.map((item) => {
            return { room_name: item.room_name, room_players: item.room_players, room_time: item.room_time, players: item.player_arr }
        }));
    })


    //handle for room's creation
    socket.on("createRoom", (name, time) => {
        var room = {
            room_name: name,
            room_time: time,
            room_players: 0,
            arr_story: [],
            history: [],
            contatore: 0,
            player_arr: [],
            white: {},
            black: {},
            interval: function () { },
            w_timer: parseInt(time) * 60,
            b_timer: parseInt(time) * 60,
            game: new jsChessEngine.Game()
        }
        Arr_rooms.push(room);
        io.sockets.emit("send_arr", Arr_rooms.map((item) => {
            return { room_name: item.room_name, room_players: item.room_players, room_time: item.room_time, players: item.player_arr }
        }));

    })


    //handle for room's join
    socket.on("join", (name, user, score) => {
        let stanza = Arr_rooms.find(item => item.room_name == name);
        var player = {
            player_username: user,
            player_score: score,
            id: socket.id
        }

        stanza.room_players++;
        stanza.player_arr.push(player);
        socket.join("room-" + name);

        //function to set random black and white players
        if (stanza.room_players == 2) {
            const index = Math.floor(Math.random() * 2);
            stanza.white = stanza.player_arr[index];
            stanza.black = stanza.player_arr[1 - index];
            io.sockets.in("room-" + stanza.room_name).emit("setWhite", stanza.white.player_username);
            io.sockets.in("room-" + stanza.room_name).emit("setBlack", stanza.black.player_username);
            io.sockets.in("room-" + stanza.room_name).emit("setPlayer", stanza.white.player_username, stanza.black.player_username, stanza.white.player_score, stanza.black.player_score);
            io.sockets.in("room-" + stanza.room_name).emit("start_w_timer");
            if (stanza.white.player_username == stanza.black.player_username) {
                io.sockets.in("room-" + stanza.room_name).emit("invalidgame");

            }
        }
        if (stanza.player_arr.length > 1) {
            io.sockets.in("room-" + name).emit("setLoader", false)
        }
        //function to set Watcher
        if (stanza.player_arr.length > 2) {
            socket.emit("setWatcher", true, stanza.history, stanza.arr_story, stanza.contatore, stanza.w_timer, stanza.b_timer);
            socket.emit("setPlayer", stanza.white.player_username, stanza.black.player_username, stanza.white.player_score, stanza.black.player_score);
        }

        io.sockets.emit("send_arr", Arr_rooms.map((item) => {
            return { room_name: item.room_name, room_players: item.room_players, room_time: item.room_time, players: item.player_arr }
        }));
    })

    //handler for the chat
    socket.on("chat message", (message, room) => {
        message = message.toString();
        io.sockets.in("room-" + room).emit("chat message", message);
    });

    //handler for the possible moves of the piece
    socket.on("PossibleMovesReq", (position, user, room) => {
        let stanza = Arr_rooms.find(item => item.room_name == room);
        if (user == stanza.white.player_username || user == stanza.black.player_username) {
            message = stanza.game.moves(position);
            socket.emit("chat private", message);
        }
    })

    //handler for move the piece
    socket.on("movePiece", (new_p, old_p, user, room) => {
        let stanza = Arr_rooms.find(item => item.room_name == room);
        if (user == stanza.white.player_username || user == stanza.black.player_username) {
            stanza.history.push(old_p);
            stanza.history.push(new_p);
            stanza.game.move(old_p, new_p);
            io.sockets.in("room-" + stanza.room_name).emit("moveFrontEnd", new_p, old_p);
            let checkmate = stanza.game.exportJson().checkMate;
            let isFinish = stanza.game.exportJson().isFinished;

            //controll the checkmate
            if (checkmate && isFinish) {
                let winner = stanza.game.exportJson().turn;
                io.sockets.in("room-" + stanza.room_name).emit("setWinner", winner);

            }
            //controll the draw
            else if (!checkmate && isFinish) {
                io.sockets.in("room-" + stanza.room_name).emit("draw", true);

            }
        }
    })


    //refresh the history of moves
    socket.on("refreshHistory", (story, counter, room) => {
        let stanza = Arr_rooms.find(item => item.room_name == room);
        stanza.arr_story = story;
        stanza.contatore = counter;
    })

    //handler for castling
    socket.on("arrocco", (new_p, old_p, user, room) => {
        let stanza = Arr_rooms.find(item => item.room_name == room);
        if (user == stanza.white.player_username) {
            stanza.history.push(old_p);
            stanza.history.push(new_p);
        }
    })

    //handler for the exit
    socket.on("exit", async (user, room) => {

        let stanza = Arr_rooms.find(item => item.room_name == room);
        clearInterval(stanza.interval);
        if (user == stanza.black.player_username || user == stanza.white.player_username) {
            io.sockets.in("room-" + stanza.room_name).emit("abbandono", user);

            if (user == stanza.black.player_username) {
                let punteggi = global.getScore(stanza.black.player_score, stanza.white.player_score);
                let score;
                if (parseInt(stanza.black.player_score) > parseInt(stanza.white.player_score)) {
                    stanza.black.player_score -= parseInt(punteggi[0]);
                    score = parseInt(stanza.white.player_score) + parseInt(punteggi[0]);
                    io.sockets.in("room-" + stanza.room_name).emit("send_p", punteggi[0]);
                }
                else {
                    stanza.black.player_score -= parseInt(punteggi[1]);
                    score = parseInt(stanza.white.player_score) + parseInt(punteggi[1]);
                    io.sockets.in("room-" + stanza.room_name).emit("send_p", punteggi[1]);
                }

                if (stanza.black.player_score < 0) {
                    stanza.black.player_score = 0;
                }
                io.sockets.in("room-" + stanza.room_name).emit("setFinish", true);
                await models.findOneAndUpdate({ username: stanza.black.player_username }, { score: stanza.black.player_score });
                await models.findOneAndUpdate({ username: stanza.white.player_username }, { score: score });
            }
            else if (user == stanza.white.player_username) {
                let punteggi = global.getScore(stanza.black.player_score, stanza.white.player_score);
                let score;
                if (parseInt(stanza.white.player_score) > parseInt(stanza.black.player_score)) {
                    stanza.white.player_score -= parseInt(punteggi[0]);
                    score = parseInt(stanza.black.player_score) + parseInt(punteggi[0]);
                    io.sockets.in("room-" + stanza.room_name).emit("send_p", punteggi[0]);
                }
                else {
                    stanza.white.player_score -= parseInt(punteggi[1]);
                    score = parseInt(stanza.black.player_score) + parseInt(punteggi[1]);
                    io.sockets.in("room-" + stanza.room_name).emit("send_p", punteggi[1]);
                }
                if (stanza.white.player_score < 0) {
                    stanza.white.player_score = 0;
                }
                io.sockets.in("room-" + stanza.room_name).emit("setFinish", true);
                await models.findOneAndUpdate({ username: stanza.white.player_username }, { score: stanza.white.player_score });
                await models.findOneAndUpdate({ username: stanza.black.player_username }, { score: score });
            }
        }
    })

    //handler for start the timer of white
    socket.on("w_start", (room) => {
        let stanza = Arr_rooms.find(item => item.room_name == room);
        stanza.interval = setInterval(() => {
            if (stanza.w_timer > 0) {
                stanza.w_timer--;
                io.sockets.in("room-" + stanza.room_name).emit("down_t", stanza.w_timer);
            } else {
                let winner = stanza.game.exportJson().turn;
                io.sockets.in("room-" + stanza.room_name).emit("setWinner", winner);
            }
        }, 1200)
    })

    //handler for start the timer of black
    socket.on("b_start", (room) => {
        let stanza = Arr_rooms.find(item => item.room_name == room);
        stanza.interval = setInterval(() => {
            if (stanza.b_timer > 0) {
                stanza.b_timer--;
                io.sockets.in("room-" + stanza.room_name).emit("down_t_2", stanza.b_timer);
            } else {
                let winner = stanza.game.exportJson().turn;
                io.sockets.in("room-" + stanza.room_name).emit("setWinner", winner);
            }
        }, 1200)
    })

    //function for stop the timer
    socket.on("clear_interval", (room) => {
        let stanza = Arr_rooms.find(item => item.room_name == room);
        clearInterval(stanza.interval);
    })

    //handler of disconnection
    socket.on("disconnect", async () => {
        let playerToRemove;
        let roomToUpdate;

        Arr_rooms.forEach((item) => {
            playerToRemove = item.player_arr.find(elem => elem.id == socket.id)
            if (playerToRemove != undefined) {
                roomToUpdate = item;
                if (playerToRemove.player_username == roomToUpdate.black.player_username || playerToRemove.player_username == roomToUpdate.white.player_username) {
                    io.sockets.in("room-" + roomToUpdate.room_name).emit("setFinish", true);
                }
                roomToUpdate.room_players--;
                roomToUpdate.player_arr.pop(playerToRemove);
                socket.leave("room-" + roomToUpdate.room_name);
                if (roomToUpdate.room_players < 2) {
                    io.socketsLeave("room-" + roomToUpdate.room_name);
                    Arr_rooms.pop(roomToUpdate);
                }
                return;
            }
        })
    });
});


//function to run the server

httpServer.listen(global.SOCKET_IO_PORT, () => {
    console.log("ws server listen on port 3000");
});

app.listen(global.SERVER_PORT, () => {
    console.log("Server listen on port 8080");
});



