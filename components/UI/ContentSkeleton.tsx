
import Skeleton from './Skeleton';

export const ContentSkeleton = () => {
    return (
        <div className="max-w-[1600px] mx-auto px-6 py-8 space-y-8 animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="space-y-2">
                    <Skeleton className="w-48 h-10 rounded-xl" />
                    <Skeleton className="w-64 h-5 rounded-lg" />
                </div>
                <div className="flex items-center gap-4">
                    <Skeleton className="hidden md:block w-48 h-6 rounded-lg" />
                    <Skeleton className="w-32 h-12 rounded-xl" />
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 h-32 flex flex-col justify-between">
                        <div>
                            <Skeleton className="w-24 h-4 rounded-md mb-2" />
                            <Skeleton className="w-16 h-8 rounded-lg" />
                        </div>
                        <Skeleton className="w-10 h-10 rounded-xl self-end" />
                    </div>
                ))}
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column (Similar to Tasks/Heatmap) */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 h-[400px]">
                        <div className="flex justify-between mb-6">
                            <div className="space-y-2">
                                <Skeleton className="w-48 h-8 rounded-lg" />
                                <Skeleton className="w-32 h-4 rounded-md" />
                            </div>
                            <Skeleton className="w-20 h-8 rounded-full" />
                        </div>
                        <div className="space-y-4">
                            {[1, 2, 3].map(i => <Skeleton key={i} className="w-full h-20 rounded-xl" />)}
                        </div>
                    </div>
                    <Skeleton className="w-full h-64 rounded-3xl" />
                </div>

                {/* Right Column (Similar to Report/Upcoming) */}
                <div className="space-y-8">
                    <Skeleton className="w-full h-80 rounded-3xl" />
                    <Skeleton className="w-full h-64 rounded-3xl" />
                </div>
            </div>
        </div>
    );
};

export default ContentSkeleton;
