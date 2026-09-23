type SearchFadeLoaderProps = {
    className?: string;
    label?: string;
};

const BARS = Array.from({ length: 12 }, (_, i) => i + 1);

/** Uiverse fade-bar loader (david-mohseni) */
function SearchFadeLoader({ className = '', label = 'Loading' }: SearchFadeLoaderProps) {
    return (
        <div
            className={`search-fade-loader ${className}`.trim()}
            role="status"
            aria-label={label}
        >
            {BARS.map((n) => (
                <div key={n} className={`bar${n}`} />
            ))}
        </div>
    );
}

export default SearchFadeLoader;
