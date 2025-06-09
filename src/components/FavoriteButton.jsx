// FavoriteButton.jsx
import React from 'react';
import IconButton from '@mui/material/IconButton';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';

/**
 * @param {boolean} initial  – starting "favorited" state
 * @param {(isFav: boolean) => void} onToggle – called each time user toggles
 */
export default function FavoriteButton({ initial = false, onToggle }) {
  const handleClick = () => {
    if (onToggle) onToggle(!initial);
  };

  return (
    <IconButton onClick={handleClick} aria-label="toggle favorite">
      {initial
        ? <StarIcon color="warning" />
        : <StarBorderIcon />}
    </IconButton>
  );
}
