import React from "react";
import ReactDOM from "react-dom";
import { Provider as ReduxProvider } from "react-redux";
import "normalize.css";
import "./styles/index.scss";

import Main from "./Main";
import reportWebVitals from "./reportWebVitals";
import * as serviceWorker from "./serviceWorker";
import { store } from "./store/store";

// import main sass file
//import "./sass/app.scss";

ReactDOM.render(
  <React.StrictMode>
    <ReduxProvider store={store}>
      <Main />
    </ReduxProvider>
  </React.StrictMode>,
  document.getElementById("root")
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
serviceWorker.unregister();
