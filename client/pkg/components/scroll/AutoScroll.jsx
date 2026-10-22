import React, { useRef, useEffect, useState } from 'react';

export const AutoScroll = ({ children, speed = 1, pauseOnHover = true }) => {
    const containerRef = useRef(null);
    const contentRef = useRef(null);
    const [isHovered, setIsHovered] = useState(false);

    useEffect(() => {
        const container = containerRef.current;
        const content = contentRef.current;
        if (!container || !content) return;

        // Lưu chiều rộng của nội dung gốc
        const contentWidth = content.offsetWidth;
        let animationFrameId;

        const step = () => {
            if (!isHovered) {
                container.scrollLeft += speed;
                // Khi đã cuộn hết nội dung gốc, trừ đi chiều rộng của nội dung gốc
                if (container.scrollLeft >= contentWidth) {
                    container.scrollLeft = container.scrollLeft - contentWidth;
                }
            }
            animationFrameId = requestAnimationFrame(step);
        };

        animationFrameId = requestAnimationFrame(step);

        return () => cancelAnimationFrame(animationFrameId);
    }, [isHovered, speed]);

    return (
        <div
            ref={containerRef}
            style={{
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                width: '100%'
            }}
            onMouseEnter={() => pauseOnHover && setIsHovered(true)}
            onMouseLeave={() => pauseOnHover && setIsHovered(false)}
        >
            {/* Container chứa nội dung gốc */}
            <div ref={contentRef} style={{ display: 'inline-block' }}>
                {children}
            </div>
            {/* Nhân đôi nội dung để tạo hiệu ứng cuộn liên tục */}
            <div style={{ display: 'inline-block' }}>
                {children}
            </div>
        </div>
    );
};
