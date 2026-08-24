import React from 'react';
import { BonusList } from './BonusList';
import { Popup } from './Popup';

type Props = {
  onClose: () => void;
};

export function BonusModal({ onClose }: Props) {
  return (
    <Popup title="Bonus items" onClose={onClose} closeLabel="Got it">
      <BonusList />
    </Popup>
  );
}
