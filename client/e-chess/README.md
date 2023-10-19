# e-Chess

e-Chess è una piattaforma web che permette di giocare online a scacchi contro altri giocatori tramite la creazione di stanze. Ogni utente potrà creare una stanza gioco o entrare in una stanza già esistente per partecipare o assistere alla partita in tempo reale<br>
Gli utenti devono registarsi per poter giocare, ad ogni utente sarà assegnato un punteggio che aumenterà in base al numero di vittorie.

Per la realizzazione del progetto sono state utilizzate le seguenti tecnologie:
<ul>
  <li>Angular </li>
  <li>NodeJS</li>
  <li>Socket.IO</li>
  <li>MongoDB</li>
</ul>

## Prerequisiti

* installare NodeJS versione 18.16.0
https://nodejs.org/en/download

* installare Angular https://angular.io/guide/setup-local

* installare MongoDB https://www.mongodb.com/try/download/community


## Configurazione
Scaricare la repository con il comando 
```shell
git clone https://github.com/Simo23-cpp/e-Chess.git
```

Creare un database MongoDB senza collezioni<br>

Inserire nel file server/config.js del backend la stringa  di connessione seguita dal nome del database<br>
es: "mongodb://127.0.0.1:27017/e-chess"

Dopo installare le dipendenze da terminale

per il backend
```shell
$ cd server
$ npm install
```


per il frontend

```shell
$ cd client/e-chess
$ npm install
```

### Opzionale
Settare le porte del server e di socket.io nel file server/config.js o usare quelle presenti di default.

Qualora le porte venissero cambiate:<br>
settare nel frontend client/e-chess/src/app/config.ts la stringa di connessione alla websocket e il server path

## Avvio

avviare il server con i comandi:

```shell
$ cd server
$ node server.js
```

avviare il frontend con i comandi:

```shell
$ cd client/e-chess
$ ng serve
```

aprire il browser e digitare http://localhost:4200/ nella barra di ricerca