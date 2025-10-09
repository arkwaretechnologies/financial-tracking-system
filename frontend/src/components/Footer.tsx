export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-400 py-4 w-full">
      <div className="container mx-auto px-4 text-center">
        <p className="text-sm">
          Powered by Arkware Technologies ©{currentYear}
        </p>
      </div>
    </footer>
  );
}

