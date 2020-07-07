import React, { useMemo } from "react";
import ReactDOM from "react-dom";

import Enzyme, { shallow } from "enzyme";
import Adapter from "enzyme-adapter-react-16";

import { usePeerState } from "./";
import {
  createAuthFilter,
  createEncryptionFilter,
  createMockKeychain,
} from "@peerstate/core";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

Enzyme.configure({ adapter: new Adapter() });

type StateTreeType = any;

const peerstateForUser = ({ email }: { email: string }) => {
  const keychain = createMockKeychain();
  let userId: string | undefined = email;
  return {
    userId,
    keychain,
    /**
     * Authorization Filters
     *
     * 1. match a part of the state tree
     * 2. check who is trying to access
     * 3. return true if they are allowed
     */
    myAuthFilter: createAuthFilter<StateTreeType>({
      "/lastName": () => true,
      "/users/:userId": () => true,
      "/counter": () => true,
    }),

    /**
     * Encryption Filters
     *
     * 1. match a part of the state tree
     * 2. return false if there is no need to encrypt
     * 3. to encrypt return a list of user ID's that can see the information
     */
    myEncryptionFilter: createEncryptionFilter<StateTreeType>({
      "/lastName": () => ["2"],
      "/counter": () => ["2"],
    }),
  };
};

function App() {
  let { myAuthFilter, myEncryptionFilter, keychain, userId } = useMemo(
    () => peerstateForUser({ email: "user1@example.com" }),
    []
  );
  const { state, dispatch, sign } = usePeerState<StateTreeType>(
    {},
    myAuthFilter,
    myEncryptionFilter,
    keychain
  );

  return (
    <div>
      <p>{JSON.stringify(state)}</p>
      <button
        onClick={() => {
          (async () => {
            if (!userId) throw new Error("no auth token present");
            try {
              const action = await sign({
                op: "add",
                path: "/counter",
                value: (state.counter || 0) + 1,
              });
              dispatch(action);
            } catch (e) {
              console.error(e);
            }
          })();
        }}
      >
        dispatch
      </button>
      <button
        onClick={() => {
          (async () => {
            await keychain.login("user1@example.com", "password1");
          })();
        }}
      >
        login
      </button>
      <button
        onClick={() => {
          keychain.newKeypair();
        }}
      >
        generate key
      </button>
      <button
        onClick={() => {
          keychain.fetchOrCreateSecret("2");
        }}
      >
        shared secret
      </button>
      <button
        onClick={() => {
          keychain.rotateKeys();
        }}
      >
        rotate keys
      </button>
    </div>
  );
}

it("renders without crashing", () => {
  const div = document.createElement("div");
  ReactDOM.render(<App />, div);
  ReactDOM.unmountComponentAtNode(div);
});

it("can log in and dispatch an action", async () => {
  const wrapper = shallow(<App />);
  wrapper.find({ children: "login" }).simulate("click");
  wrapper.find({ children: "generate key" }).simulate("click");
  wrapper.find({ children: "dispatch" }).simulate("click");
  await sleep(0);
  wrapper.update();
  const { counter } = JSON.parse(wrapper.find("p").text());
  expect(counter).toEqual(1);
});
