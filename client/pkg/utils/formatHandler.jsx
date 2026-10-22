export const formatDateTime = (inputDateTime) => {
    const date = new Date(inputDateTime);

    const options = { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" };
    const formattedDate = date.toLocaleDateString("en-US", options);

    // const hours = date.getUTCHours(); // Giờ theo UTC
    // const minutes = date.getUTCMinutes(); // Phút theo UTC

    const hours = date.getHours(); // Giờ theo UTC
    const minutes = date.getMinutes(); // Phút theo UTC

    const formattedTime = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;

    return `${formattedDate}, ${formattedTime}`;
}

export const formatDateTimeMySQL = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');  // Months are zero-indexed
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

export const formatRatings = (ratings) => Math.floor(ratings * Math.pow(10, 1)) / Math.pow(10, 1)