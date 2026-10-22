import React from 'react';

export default function RatingStar({ rating }) {
    // Sanitize rating to be between 0 and 5
    const sanitizedRating = Math.max(0, Math.min(rating, 5));
    const fullStars = Math.floor(sanitizedRating); // Full stars count
    const halfStar = sanitizedRating % 1 >= 0.1 ? 1 : 0; // Half-star check
    const emptyStars = 5 - fullStars - halfStar; // Remaining empty stars

    // Ensure valid star counts
    return (
        <>
            {/* Full stars */}
            {Array.from({ length: fullStars }).map((_, index) => (
                <i key={`full-${index}`} className='bx bxs-star bx-sm'></i>
            ))}
            {/* Half star */}
            {halfStar === 1 && <i className='bx bxs-star-half bx-sm' key="half" />}
            {/* Empty stars */}
            {Array.from({ length: emptyStars }).map((_, index) => (
                <i key={`empty-${index}`} className='bx bx-star bx-sm'></i>
            ))}
        </>
    );
};
