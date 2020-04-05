import { useReducer, Reducer } from "react";
import {
  createPeerState,
  AuthFilter,
  EncryptionFilter,
  Keychain,
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
  const { nextState, sign: signWithState } = createPeerState(
    authFilter,
    encryptionFilter,
    keychain
  );
  const [state, dispatch] = useReducer<
    Reducer<InternalState<StateTreeType>, Action>
  >(nextState, {
    peerState: initialState,
    keys: keychain,
  });
  return {
    state: state.peerState,
    dispatch,
    sign: signWithState.bind(null, state),
  };
};
