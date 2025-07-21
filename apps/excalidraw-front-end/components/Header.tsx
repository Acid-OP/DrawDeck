import React from 'react';

export const Header: React.FC = () => {
    return (
        <div className="flex flex-col items-center justify-center text-white">
                 <h1 className="text-3xl font-excali">This is Excalifont</h1>
      <h1 className="text-3xl font-virgil">This is Virgil font</h1>
      <h1 className="text-3xl">This is default font</h1>
 </div>
    );
};
