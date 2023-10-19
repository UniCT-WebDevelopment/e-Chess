const DB_CONNECTION = "mongodb://127.0.0.1:27017/e-chess";
const SERVER_PORT = 8080;
const SOCKET_IO_PORT = 3000;

//function for calculate score
const getScore = function (score1, score2) {
    const c = Math.floor(Math.abs(score1 - score2) / 10);
    var arr_result = [];
    if (c < 10) {
        let c1 = 10 + Math.floor(Math.random() * 10);
        let c2 = 20 - Math.floor(Math.random() * 10);
        arr_result.push(Math.max(c1, c2));
        arr_result.push(Math.min(c1, c2));
    }
    else {
        arr_result.push(20);
        arr_result.push(10);
    }
    return arr_result;
}

module.exports = { DB_CONNECTION, SERVER_PORT, SOCKET_IO_PORT, getScore };