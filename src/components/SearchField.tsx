import SearchIcon from '@mui/icons-material/Search';
import { InputAdornment, TextField } from '@mui/material';
import { useEffect, useState } from 'react';

/**
 * Debounced search box. Local state keeps typing responsive; the committed value
 * goes to the URL (and therefore the request) after a pause, so a five-character
 * tracking id is one query rather than five.
 */
export default function SearchField({
  value,
  onChange,
  placeholder,
  delay = 300,
}: {
  value: string;
  onChange: (next: string) => void;
  placeholder: string;
  delay?: number;
}) {
  const [draft, setDraft] = useState(value);
  const [lastValue, setLastValue] = useState(value);

  // Resync when the committed value changes from OUTSIDE this input — the back
  // button, or landing on a shared link. Adjusted during render rather than in an
  // effect: setState inside an effect triggers a second render pass, and the lint
  // rule that flags it is right to.
  if (value !== lastValue) {
    setLastValue(value);
    setDraft(value);
  }

  useEffect(() => {
    if (draft === value) return;
    const t = setTimeout(() => onChange(draft), delay);
    return () => clearTimeout(t);
  }, [draft, value, onChange, delay]);

  return (
    <TextField
      size="small"
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      placeholder={placeholder}
      sx={{ minWidth: 280 }}
      slotProps={{
        input: {
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon fontSize="small" />
            </InputAdornment>
          ),
        },
      }}
    />
  );
}
