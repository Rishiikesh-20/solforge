export default function Loading() {
  return (
    <div className="flex flex-col justify-center items-center h-screen bg-black w-screen">
      <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-cyan-400"></div>
      <span className="mt-4 text-lg text-cyan-400">Loading transfer page...</span>
    </div>
  );
}
