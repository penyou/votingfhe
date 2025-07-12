import React from "react";

function VoteForm({ onVote }) {
  return (
    <div>
      <h2>Cast Your Vote</h2>
      <button onClick={() => onVote(1)}>Vote Yes</button>
      <button onClick={() => onVote(0)}>Vote No</button>
    </div>
  );
}

export default VoteForm;
