import React, { useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css'; // Import CSS mặc định của react-calendar

const DatePicker = () => {
    const [selectedDate, setSelectedDate] = useState(new Date());

    const handleDateChange = (date) => {
        setSelectedDate(date);
        // console.log("Ngày được chọn:", date);
    };

    return (
        <div className="d-flex flex-column align-items-center mt-4">
            <h3>Chọn ngày:</h3>
            <Calendar
                onChange={handleDateChange}
                value={selectedDate}
                locale="en-US" // Đặt ngôn ngữ hiển thị
                calendarType="US" // Cài đặt kiểu lịch
            />
            <p>Ngày được chọn: {selectedDate.toDateString()}</p>
        </div>
    );
};

export default DatePicker;
