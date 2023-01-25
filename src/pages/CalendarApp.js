/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { useState } from "react";

import Calendar from "../components/calendar/Calendar";
import { months } from "../data/months";
import useCurrentDateTime from "../hooks/useCurrentDateTime";
import "./CalendarApp.scss";

function CalendarApp() {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const { currentMonthName } = useCurrentDateTime();

  return (
    <div className="App">
      <header className="App-header">
        <h1>Current Month: {currentMonthName}</h1>
        <select
          style={{
            float: "left",
            width: "150px",
            padding: "12px",
            border: "1px solid #ccc",
            borderRadius: "4px",
            backgroundColor: "#f8f8f8",
            fontSize: "16px",
            color: "#444",
          }}
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
        >
          <option value="">Select Month</option>
          {months.map(
            (month) => (
              <option key={month.code} value={month.name}>
                {month.name}
              </option>
            ),
            console.log(selectedMonth)
          )}
        </select>
        <Calendar selectedMonth={selectedMonth} />
      </header>

      <footer className="App-footer">
        <div className="footer-container">
          <p>
            Copyright © {new Date().getFullYear()} Francisco Gabriel Abreu
            Calendar APP{" "}
          </p>
          <nav>
            <a
              style={{ margin: "0 10px", display: "inline-block" }}
              href="https://github.com/Gabbs27"
            >
              About
            </a>
            <a
              style={{ margin: "0 10px", display: "inline-block" }}
              href="https://www.linkedin.com/in/francisco-gabriel-abreu-cornelio/"
            >
              Contact
            </a>
          </nav>
        </div>
      </footer>
    </div>
  );
}

export default CalendarApp;
