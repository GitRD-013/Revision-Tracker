import React from 'react';

interface SkeletonProps {
    className?: string;
    variant?: 'text' | 'rect' | 'circle';
}

const Skeleton: React.FC<SkeletonProps> = ({ className = "", variant = 'rect' }) => {
    const baseClass = "animate-pulse bg-gray-200";
    const variantClasses = {
        text: "h-4 rounded",
        rect: "rounded-2xl",
        circle: "rounded-full"
    };

    return (
        <div className={`${baseClass} ${variantClasses[variant]} ${className}`}></div>
    );
};

export default Skeleton;
