import React, {
  getState,
  getActions,
  useState,
  useEffect,
  useRef,
} from "./lib";

import styled, { ThemeProvider } from "hyperapp-styled-components";

const Test = styled.main`
  background-color: ${(props: any) => {
    return props.theme.red;
  }};
`;

const Test2 = styled.div`
  background-color: blue;
  width: 100px;
`;

const Footer = () => {
  const [count, setCount] = useState(0);
  return (
    <footer>
      Footer
      <button onclick={() => setCount(count + 1)}>{count}</button>
    </footer>
  );
};

const Item = () => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    console.log("create Item");
    return () => {
      console.log("destroy Item");
    };
  }, []);
  return (
    <div>
      Item
      <button onclick={() => setCount(count + 1)}>{count}</button>
    </div>
  );
};

const Section = () => {
  // const { toggle2 } = getState();
  // const { setToggle2 } = getActions();
  useEffect(() => {
    console.log("create section");
    return () => {
      console.log("destroy section");
    };
  }, []);
  return (
    <section>
      {/* <button onclick={() => setToggle2()}>Toggle2</button> */}
      <Item />
      {/* {toggle2 && <Item />} */}
      <Item />
    </section>
  );
};

const Header = () => {
  const [count, setCount] = useState(0);
  return (
    <header>
      Header
      <button onclick={() => setCount(count + 1)}>{count}</button>
    </header>
  );
};

const Wrapper = () => {
  const { toggle } = getState();
  const { setToggle } = getActions();

  return (
    <Test>
      <button onclick={() => setToggle()}>Toggle</button>
      <Header />
      {toggle && <Section />}
      <Footer />
    </Test>
  );
};

// const Item = ({ number }: any) => {
//   useEffect(() => {
//     console.log("useEffect", number);
//   }, []);
//   const [count, setCount] = useState(0);
//   return (
//     <li
//     // oncreate={() => {
//     //   console.log("oncreate", number);
//     // }}
//     >
//       {number}
//       <button onclick={() => setCount(count + 1)}>{count}</button>
//     </li>
//   );
// };

// const Wrapper = ({ toggle }: any) => {
//   return (
//     <div>
//       {toggle ? (
//         <ul>
//           <Item key={1} number={1} />
//           <Item key={2} number={2} />
//           <Item key={3} number={3} />
//         </ul>
//       ) : (
//         <ul>
//           <Item key={2} number={2} />
//           <Item key={3} number={3} />
//         </ul>
//       )}
//     </div>
//   );
// };

const App = () => {
  const { toggle } = getState();
  const { setToggle } = getActions();
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    console.log("create app", ref);
    return () => {
      console.log("destroy app");
    };
  }, [count]);
  return (
    // <ThemeProvider theme={{ red: "red" }}>
    //   <div ref={ref}>
    //     <button onclick={() => setCount(count + 1)}>{count}</button>
    //     <Wrapper />
    //     {[<Item />, <Item />, <Item />]}
    //   </div>
    // </ThemeProvider>

    // <div>
    //   <button onclick={() => setToggle(!toggle)}>Test</button>
    //   <Wrapper toggle={toggle} />
    // </div>
    <div>{[<Item />, <Item />, <Item />]}</div>
    // <div>{[1, 2, 3]}</div>
  );
};

React.render(
  { toggle: false, toggle2: false },
  {
    setToggle:
      () =>
      ({ toggle }) => ({ toggle: !toggle }),
    setToggle2:
      () =>
      ({ toggle2 }) => ({ toggle2: !toggle2 }),
  },
  <App />,
  document.getElementById("root")
);
