// FavoriteButton.jsx
import React, { useState } from 'react';
import IconButton from '@mui/material/IconButton';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';

/**
 * @param {boolean} initial  – starting “favorited” state
 * @param {(isFav: boolean) => void} onToggle – called each time user toggles
 */
export default function FavoriteButton({ initial = false, onToggle }) {
  const [isFav, setIsFav] = useState(initial);

  const handleClick = () => {
    const next = !isFav;
    setIsFav(next);
    if (onToggle) onToggle(next);
  };

  return (
    <IconButton onClick={handleClick} aria-label="toggle favorite">
      {isFav
        ? <StarIcon color="warning" />
        : <StarBorderIcon />}
    </IconButton>
  );
}
