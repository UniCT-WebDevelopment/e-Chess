import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { io } from 'socket.io-client';
import { ChessPieces, ChessPiecesCodes } from 'src/app/models/chess-pieces';
import { initialBoardPosition } from 'src/app/models/initial-board-position';
import { HttpClient } from '@angular/common/http';
import { SOCKET_IO_PATH } from 'src/app/config';


@Component({
  selector: 'app-game-page',
  templateUrl: './game-page.component.html',
  styleUrls: ['./game-page.component.css']
})
export class GamePageComponent implements OnInit, OnDestroy {

  ngOnInit(): void {
    this.boardPosition = JSON.parse(JSON.stringify(initialBoardPosition));
    this.connectWebSocket();
  }

  ngOnDestroy(): void {
    if (this.playerBlack != "" && this.playerWhite != "") {
      this.socket.emit("exit", sessionStorage.getItem("username"), sessionStorage.getItem("room"));
    }
    this.socket.close();
    sessionStorage.removeItem("room");
    this.router.navigate(["/home"]);
  }


  letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  numbers = [8, 7, 6, 5, 4, 3, 2, 1];
  selectedElem: any = '';
  isboardRotated: boolean = false;
  msg = new FormControl('');

  //boolean for handle the role
  isBlack = false;
  isWhite = false;
  isWatcher = false;

  //players
  playerWhite: string = "";
  playerBlack: string = "";

  //other score
  w_score: any;
  b_score: any;

  //var of victory modal setup
  victory: string = "";
  lose: string = "";
  winner: any

  //array for chat
  chat_message: string[] = [];

  //history of moves
  history: string[] = [];

  //array for moves
  moves: string[] = [];

  //piece
  cellValue: any;

  //loader
  isLoading: boolean = true;

  //modal for game finish
  isFinish: boolean = false;
  isDraw: boolean = false;
  openD: boolean = false;

  //socket.io socket setup
  socket = io(SOCKET_IO_PATH);

  //turn
  counter: number = 0;

  //board
  boardPosition: any;

  //timer
  b_timeLeft: number = parseInt(sessionStorage.getItem("time")!) * 60;
  b_min: number = Math.floor(this.b_timeLeft / 60);
  b_sec: number = this.b_timeLeft - this.b_min * 60;
  b_timer: string = this.b_min + ":" + this.b_sec.toString().concat('0');
  w_timeLeft: number = parseInt(sessionStorage.getItem("time")!) * 60;
  w_min: number = Math.floor(this.w_timeLeft / 60);
  w_sec: number = this.w_timeLeft - this.w_min * 60;
  w_timer: string = this.w_min + ":" + this.w_sec.toString().concat('0');


  constructor(private router: Router, private http: HttpClient) { }

  getPieceCodes(row: any, col: any) {
    let posVal = row + col;
    if (this.boardPosition[posVal] === '') return;
    let pieceName = ChessPieces[this.boardPosition[posVal].name]
    return ChessPiecesCodes[pieceName];
  }

  selectCell(row: any, col: number) {
    this.cellValue = row + col;
    let piece = this.getPieceCodes(row, col);
    if (this.isWhite && (this.counter % 2) == 0) {
      if (piece != undefined && (piece == ChessPiecesCodes.WhitePawn || piece == ChessPiecesCodes.WhiteRook || piece == ChessPiecesCodes.WhiteQueen || piece == ChessPiecesCodes.WhiteKnight || piece == ChessPiecesCodes.WhiteKing || piece == ChessPiecesCodes.WhiteBishop)) {
        this.socket.emit("PossibleMovesReq", this.cellValue, sessionStorage.getItem("username"), sessionStorage.getItem("room"));
      }
      else {
        if (this.moves.includes(this.cellValue)) {
          this.socket.emit("movePiece", this.cellValue, this.selectedElem, sessionStorage.getItem("username"), sessionStorage.getItem("room"));
        }
        this.clearSelectedCells();
        this.selectedElem = "";
      }
    }

    if (this.isBlack && (this.counter % 2) == 1) {
      if (piece != undefined && (piece == ChessPiecesCodes.BlackPawn || piece == ChessPiecesCodes.BlackRook || piece == ChessPiecesCodes.BlackQueen || piece == ChessPiecesCodes.BlackKnight || piece == ChessPiecesCodes.BlackKing || piece == ChessPiecesCodes.BlackBishop)) {
        this.socket.emit("PossibleMovesReq", this.cellValue, sessionStorage.getItem("username"), sessionStorage.getItem("room"));
      }
      else {
        if (this.moves.includes(this.cellValue)) {
          this.socket.emit("movePiece", this.cellValue, this.selectedElem, sessionStorage.getItem("username"), sessionStorage.getItem("room"));
        }
        this.clearSelectedCells();
        this.selectedElem = "";
      }
    }
    this.selectedElem = this.cellValue;
  }

  move(n_position: any, o_position: any) {
    this.boardPosition[n_position] =
      this.boardPosition[o_position];
    this.boardPosition[o_position] = '';
    this.selectedElem = '';
    this.clearSelectedCells();
  }


  rotateBoard() {
    if (this.isboardRotated) {
      this.letters.sort((a, b) => 0 - (a > b ? -1 : 1));
      this.numbers.sort((a, b) => 0 - (a > b ? 1 : -1));
    } else {
      this.letters.sort((a, b) => 0 - (a > b ? 1 : -1));
      this.numbers.sort((a, b) => 0 - (a > b ? -1 : 1));
    }
    this.isboardRotated = !this.isboardRotated;
  }

  clearSelectedCells() {
    const elems = Array.from(
      document.getElementsByClassName(
        'possible-move-class'
      ) as HTMLCollectionOf<HTMLElement>
    );
    elems.forEach((el) => {
      el.classList.remove('possible-move-class');
    });
  }

  //funciotn for modal
  exit() {
    this.openD = false;
    this.isFinish = true;
    this.socket.emit("exit", sessionStorage.getItem("username"), sessionStorage.getItem("room"));
  }

  //function for dialog
  open_exit_d() {
    if (!this.isWatcher) {
      this.openD = true;
    }
    else {
      this.isFinish = true;
      this.socket.close();
    }
  }

  //function for chat
  sendMsg() {
    const username = sessionStorage.getItem('username');
    let message = this.msg.value;
    let control = (message?.trim());
    if (control !== "") {
      this.socket.emit("chat message", `${username}: ${message}`, sessionStorage.getItem("room"));
    }
    this.msg.reset("");
  }

  //function for close modal
  close() {
    this.isFinish = false;
    this.router.navigate(["/home"])
  }

  connectWebSocket() {

    // Event emitted on successful connection
    this.socket.on("connected", () => {
      this.socket.emit("join", sessionStorage.getItem("room"), sessionStorage.getItem("username"), sessionStorage.getItem("score"))
    });

    this.socket.on("setWhite", (username) => {
      if (username == sessionStorage.getItem("username")) {
        this.isWhite = true;
      }
    })

    this.socket.on("setBlack", (username) => {

      if (username == sessionStorage.getItem("username")) {
        this.rotateBoard();
        this.isBlack = true;
      }
    })

    //event for set the watcher
    this.socket.on("setWatcher", (bool, arr, story, contatore, w_timer, b_timer) => {
      this.isWatcher = bool;
      let pari = 0;
      let dispari = 1;
      for (let i = 0; i < arr.length / 2; i++) {
        let from = arr[pari];
        let to = arr[dispari];
        this.move(to, from);
        let pezzo = this.getPieceCodes(to[0], to[1]);
        if (pezzo == ChessPiecesCodes.WhitePawn && to[1] == "8") {
          this.boardPosition[to].name = ChessPieces.WhiteQueen;
        }
        if (pezzo == ChessPiecesCodes.BlackPawn && to[1] == "1") {
          this.boardPosition[to].name = ChessPieces.BlackQueen;
        }
        pari = pari + 2;
        dispari = dispari + 2;
      }
      this.history = story;
      this.counter = contatore;
      this.b_timeLeft = b_timer;
      this.b_min = Math.floor(this.b_timeLeft / 60);
      this.b_sec = this.b_timeLeft - this.b_min * 60;
      this.b_timer = this.b_min + ":" + this.b_sec.toString().padStart(2, '0');
      this.w_timeLeft = w_timer;
      this.w_min = Math.floor(this.w_timeLeft / 60);
      this.w_sec = this.w_timeLeft - this.w_min * 60;
      this.w_timer = this.w_min + ":" + this.w_sec.toString().padStart(2, '0');
      alert("You are watcher, you can only watch the game at this moment");
    })

    this.socket.on("setLoader", (bool) => {
      this.isLoading = bool;
    })

    //set the players
    this.socket.on("setPlayer", (white, black, wscore, bscore) => {
      if (this.isWhite) {
        this.playerWhite = sessionStorage.getItem("username")!;
        this.playerBlack = black;
        this.w_score = wscore;
        this.b_score = bscore;
      }
      if (this.isBlack) {
        this.playerWhite = white;
        this.playerBlack = sessionStorage.getItem("username")!;
        this.w_score = wscore;
        this.b_score = bscore;
      }
      if (this.isWatcher) {
        this.playerBlack = black;
        this.playerWhite = white;
        this.w_score = wscore;
        this.b_score = bscore;
      }
    })

    // Event emitted on message received
    this.socket.on("chat message", (message: any) => {
      this.chat_message.push(message);
    });



    //emitted only for players that play
    this.socket.on("chat private", (message: any) => {
      this.moves = message;
      this.clearSelectedCells();
      this.moves.forEach((element: any) => {
        let elem = document.getElementById(element) as HTMLElement;
        elem.classList.add('possible-move-class');
      });
    });

    //event for move the piece and handle the castling
    this.socket.on("moveFrontEnd", (new_p, old_p) => {
      this.counter++;
      this.move(new_p, old_p);
      let piece = this.getPieceCodes(new_p[0], new_p[1]);
      if (piece == ChessPiecesCodes.WhiteKing && old_p == "E1" && new_p == "G1") {
        this.move("F1", "H1");
        this.history.push(this.counter + piece + " O-O ");
        this.socket.emit("arrocco", "F1", "H1", sessionStorage.getItem("username"), sessionStorage.getItem("room"));
      }
      else if (piece == ChessPiecesCodes.WhiteKing && old_p == "E1" && new_p == "C1") {
        this.move("D1", "A1");
        this.history.push(this.counter + piece + " O-O-O ");
        this.socket.emit("arrocco", "D1", "A1", sessionStorage.getItem("username"), sessionStorage.getItem("room"));
      }
      else if (piece == ChessPiecesCodes.BlackKing && old_p == "E8" && new_p == "G8") {
        this.move("F8", "H8");
        this.history.push(this.counter + piece + " O-O ");
        this.socket.emit("arrocco", "F8", "H8", sessionStorage.getItem("username"), sessionStorage.getItem("room"));
      }
      else if (piece == ChessPiecesCodes.BlackKing && old_p == "E8" && new_p == "C8") {
        this.move("D8", "A8");
        this.history.push(this.counter + piece + " O-O-O ");
        this.socket.emit("arrocco", "D8", "A8", sessionStorage.getItem("username"), sessionStorage.getItem("room"));
      }
      else {
        this.history.push(this.counter + piece + new_p + "  ");
      }
      if (piece == ChessPiecesCodes.WhitePawn && new_p[1] == "8") {
        this.boardPosition[new_p].name = ChessPieces.WhiteQueen;
      }
      if (piece == ChessPiecesCodes.BlackPawn && new_p[1] == "1") {
        this.boardPosition[new_p].name = ChessPieces.BlackQueen;
      }
      if (this.counter % 2 == 0 && this.counter > 1) {
        if (this.isWhite) {
          this.socket.emit("clear_interval", sessionStorage.getItem("room"));
          this.socket.emit("w_start", sessionStorage.getItem("room"));
        }
      }
      else if (this.counter % 2 == 1) {
        if (this.isBlack) {
          this.socket.emit("clear_interval", sessionStorage.getItem("room"));
          this.socket.emit("b_start", sessionStorage.getItem("room"));
        }
      }

      this.socket.emit("refreshHistory", this.history, this.counter, sessionStorage.getItem("room"));
      this.moves = [];
    })

    this.socket.on("setFinish", (bool) => {
      this.isFinish = bool;
      this.socket.close();
    })

    this.socket.on("setWinner", (turn) => {
      if (turn == "black") {
        ;
        this.winner = this.playerWhite;
        this.socket.emit("exit", this.playerBlack, sessionStorage.getItem("room"));
      }
      if (turn == "white") {
        this.winner = this.playerBlack;
        this.socket.emit("exit", this.playerWhite, sessionStorage.getItem("room"));
      }

    })

    this.socket.on("abbandono", (user) => {
      if (user == this.playerBlack) {
        this.winner = this.playerWhite;
      }
      if (user == this.playerWhite) {
        this.winner = this.playerBlack;
      }
    })


    this.socket.on("start_w_timer", () => {
      if (this.isWhite) {
        this.socket.emit("w_start", sessionStorage.getItem("room"));
      }
    })

    this.socket.on("down_t", (n_time) => {
      this.w_timeLeft = parseInt(n_time);
      this.w_min = Math.floor(this.w_timeLeft / 60);
      this.w_sec = this.w_timeLeft - this.w_min * 60;
      if (this.w_sec < 10) {
        this.w_timer = this.w_min + ":" + this.w_sec.toString().padStart(2, '0');
      } else {
        this.w_timer = this.w_min + ":" + this.w_sec;
      }
    })


    this.socket.on("down_t_2", (n_time) => {
      this.b_timeLeft = parseInt(n_time);
      this.b_min = Math.floor(this.b_timeLeft / 60);
      this.b_sec = this.b_timeLeft - this.b_min * 60;
      if (this.b_sec < 10) {
        this.b_timer = this.b_min + ":" + this.b_sec.toString().padStart(2, '0');
      } else {
        this.b_timer = this.b_min + ":" + this.b_sec;
      }
    })

    this.socket.on("send_p", (punteggio) => {
      this.victory = "+" + punteggio.toString();
      this.lose = "-" + punteggio.toString();
    })

    this.socket.on("draw", () => {
      this.isDraw = true;
      this.socket.emit("clear_interval", sessionStorage.getItem("room"));
      this.socket.close();
    })

    this.socket.on("invalidgame", () => {
      alert("invalid game");
      this.socket.close();
      this.router.navigate(["/home"]);
    })


    // Event emitted on not found error
    this.socket.on("connect_error", () => {
      alert("Socket closed");
    });

  }
}


