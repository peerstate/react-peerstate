import { useState } from "react";
import {
  createPeerState,
  AuthFilter,
  EncryptionFilter,
  Keychain,
  withRetries,
  Action,
} from "@peerstate/core";

type InternalState<T> = {
  peerState: T;
  keys: Keychain;
};

export const usePeerState = function <StateTreeType>(
  initialState: StateTreeType,
  authFilter: AuthFilter<StateTreeType>,
  encryptionFilter: EncryptionFilter<StateTreeType>,
  keychain: Keychain
) {
  const { nextState, sign: signWithState } = withRetries(
    createPeerState(authFilter, encryptionFilter, keychain)
  );
  const [state, setState] = useState<InternalState<StateTreeType>>({
    peerState: initialState,
    keys: keychain,
  });
  return {
    state: state.peerState,
    dispatch: (a: Action | false) =>
      nextState(state, a).then((s: InternalState<StateTreeType>) =>
        setState(s)
      ),
    sign: signWithState.bind(null, state),
  };
};
