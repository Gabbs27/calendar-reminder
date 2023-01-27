import React from "react";
import ReactDOM from "react-dom";
import { Provider as ReduxProvider } from "react-redux";
import "normalize.css";
import "./styles/index.scss";

import * as serviceWorker from "./serviceWorker";
import { store } from "./store/store";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import App from "./pages/App";
import Calendar from "./pages/Calendar";

// import main sass file
//import "./sass/app.scss";

ReactDOM.render(
  <ReduxProvider store={store}>
    <BrowserRouter>
      <Routes>
        <Route exact path='/' element={<App />} />
        <Route exact path='/calendar' element={<Calendar />} />
      </Routes>
    </BrowserRouter>
  </ReduxProvider>,
  document.getElementById("root")
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals

serviceWorker.unregister();
