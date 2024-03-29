import React from "react";
import { useDispatch, useSelector } from "react-redux";

import moment from "moment";
import PropTypes from "prop-types";
import { v4 as uuidv4 } from "uuid";

import { cities } from "../../data/countries";
import useCurrentDateTime from "../../hooks/useCurrentDateTime";
import useForm from "../../hooks/useForm";
import Button from "../button/Button";
import {
  dateWeatherConditionsThunk,
  selectCalendar,
} from "../calendar/calendarSlice";
import "./reminderForm.scss";
import { handleShowModal } from "../modal/modalSlice";
import {
  createReminder,
  updateReminder,
  deleteReminder,
} from "./reminderFormSlice";

const Reminderform = ({ reminderData, isEdit, handleLocalModal }) => {
  const dispatch = useDispatch();
  const { weather, weatherStatus } = useSelector(selectCalendar);
  const { currentTime, endOfMonth, startOfMonth } = useCurrentDateTime();
  const { data, setData, handleSubmit, handleInputChange, errors } = useForm({
    validations: {
      reminder: {
        required: {
          value: true,
          message: "Reminder field is required",
        },
        custom: {
          isValid: (value) => value.length < 30,
          message: "The reminder needs to have 30 caractheres",
        },
      },
      city: {
        required: {
          value: true,
          message: "City field is required",
        },
      },
      date: {
        required: {
          value: true,
          message: "Date field is required",
        },
      },
      time: {
        required: {
          value: true,
          message: "Time field is required",
        },
      },
      color: {
        required: {
          value: true,
          message: "Color field is required",
        },
      },
    },
    initialValues: {
      reminder: "",
      city: "",
      date: "",
      time: "",
      color: "",
      day: "",
      weather: null,
    },
  });

  const updateSubmit = React.useCallback(async () => {
    dispatch(dateWeatherConditionsThunk(data.city));
    dispatch(
      updateReminder({
        id: uuidv4(),
        ...data,
        day: moment(data.date).format("DD"),
        weather: weather[0] !== null ? weather[0] : null,
      })
    );
    dispatch(handleShowModal(false));
  }, [data, dispatch, weather]);

  const incrementSubmit = React.useCallback(async () => {
    dispatch(dateWeatherConditionsThunk(data.city));
    dispatch(
      createReminder({
        id: uuidv4(),
        ...data,
        day: moment(data.date).format("DD"),
        weather: weather !== null ? weather[0] : null,
      })
    );
    handleLocalModal(false);
  }, [dispatch, data, weather, handleLocalModal]);

  const deleteReminderOnClick = React.useCallback(async () => {
    dispatch(deleteReminder(data.id));
    dispatch(handleShowModal(false));
  }, [data.id, dispatch]);

  React.useEffect(() => {
    if (reminderData && isEdit) {
      setData(reminderData);
    }
    return () => {
      // eslint-disable-next-line no-unused-expressions
      reminderData;
    };
  }, [isEdit, reminderData, setData]);

  return (
    <form
      className="form-container"
      onSubmit={(e) =>
        reminderData
          ? handleSubmit(e, updateSubmit)
          : handleSubmit(e, incrementSubmit)
      }
    >
      <div className="wrapper">
        <div className="form-group">
          <label htmlFor="reminder-input" className="form-label">
            Reminder
          </label>
          <input
            type="text"
            id="reminder-input"
            aria-label="reminder-input"
            className="form-input"
            placeholder="Place your reminder"
            max={30}
            maxLength={30}
            name="reminder"
            value={data.reminder || ""}
            onChange={(e) => handleInputChange(e)}
          />
          {errors.reminder && <p className="form-error">{errors.reminder}</p>}
        </div>
        <div className="form-group">
          <label htmlFor="City-select" className="form-label">
            City:
          </label>
          <select
            id="city-select"
            aria-label="city-select"
            className="form-input"
            name="city"
            value={data.city}
            onChange={(e) => handleInputChange(e)}
          >
            <option value="">Select a City</option>
            {cities.map((city) => (
              <option key={city.code} value={city.name}>
                {city.name}
              </option>
            ))}
          </select>
          {errors.city && <p className="form-error">{errors.city}</p>}
        </div>

        <div className="form-group">
          <label htmlFor="date-input" className="form-label">
            Date
          </label>
          <input
            type="date"
            min={startOfMonth}
            max={endOfMonth}
            id="date-input"
            aria-label="date-input"
            className="form-input"
            placeholder="Place your date"
            name="date"
            value={data.date || ""}
            onChange={(e) => handleInputChange(e)}
          />
          {errors.date && <p className="form-error">{errors.date}</p>}
        </div>
        <div className="form-group">
          <label htmlFor="time-input" className="form-label">
            Time
          </label>
          <input
            type="time"
            min={currentTime}
            max="23:59"
            id="time-input"
            aria-label="time-input"
            className="form-input"
            placeholder="Place your time"
            name="time"
            value={data.time || ""}
            onChange={(e) => handleInputChange(e)}
          />
          {errors.time && <p className="form-error">{errors.time}</p>}
        </div>
        <div className="form-group">
          <label className="form-label">Color</label>
          <div className="row">
            <input
              type="radio"
              id="color-green-input"
              aria-label="color-green-input"
              className="form-input-radio"
              name="color"
              value="green"
              checked={data.color === "green" || false}
              onChange={(e) => handleInputChange(e)}
            />
            <label htmlFor="color-green-input" className="form-label">
              Green
            </label>
          </div>
          <div className="row">
            <input
              type="radio"
              id="color-yellow-input"
              aria-label="color-yellow-input"
              className="form-input-radio"
              name="color"
              value="yellow"
              checked={data.color === "yellow" || false}
              onChange={(e) => handleInputChange(e)}
            />
            <label htmlFor="color-yellow-input" className="form-label">
              Yellow
            </label>
          </div>
          <div className="row">
            <input
              type="radio"
              id="color-red-input"
              aria-label="color-red-input"
              className="form-input-radio"
              name="color"
              value="red"
              checked={data.color === "red" || false}
              onChange={(e) => handleInputChange(e)}
            />
            <label htmlFor="color-red-input" className="form-label">
              Red
            </label>
          </div>
          {errors.color && <p className="form-error">{errors.color}</p>}
        </div>
      </div>
      <Button
        type="submit"
        text="SUBMIT"
        color="success"
        isDisabled={weatherStatus === "loading"}
        id="submit-create-reminder"
      />
      {isEdit && (
        <Button
          type="button"
          text="DELETE"
          color="danger"
          isDisabled={weatherStatus === "loading"}
          onClick={() => deleteReminderOnClick()}
          id="submit-delete-reminder"
        />
      )}
    </form>
  );
};

Reminderform.propTypes = {
  reminderData: PropTypes.object,
  isEdit: PropTypes.bool,
  handleLocalModal: PropTypes.func,
};

export default Reminderform;
