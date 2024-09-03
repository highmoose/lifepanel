import React from "react";

const DateFormatter = ({ date }) => {
  // Convert the date string to a Date object
  const formattedDate = new Date(date);

  // Define months array for converting month index to month name
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  // Extract day, month, and year from the formatted date
  const day = formattedDate.getDate();
  const month = months[formattedDate.getMonth()];
  const year = formattedDate.getFullYear().toString().slice(-2); // Extract last two digits of the year

  // Concatenate day, month, and year in the desired format
  const formattedDateString = `${day} ${month} ${year}`;

  return <span>{formattedDateString}</span>;
};

export default DateFormatter;
