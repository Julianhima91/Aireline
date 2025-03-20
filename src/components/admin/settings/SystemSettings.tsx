import React from 'react';
import { ApiModeControl } from './ApiModeControl';
import { FlightApiConfig } from './FlightApiConfig';

export function SystemSettings() {
  return (
    <div className="space-y-6">
      <FlightApiConfig />
      <ApiModeControl />
    </div>
  );
}