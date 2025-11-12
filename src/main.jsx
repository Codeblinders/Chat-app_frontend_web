import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import ChatRoot from "./ChatRoot"; // or your Routes wrapper if using <Routes>
import "./index.css"
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  // <React.StrictMode>
    <BrowserRouter>
      <ChatRoot />
    </BrowserRouter>
    // </React.StrictMode> 

);
