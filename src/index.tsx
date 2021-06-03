import React from "./lib";

// const Footer = () => {
//   return <footer>Bottom</footer>;
// };

// const Section = () => {
//   return <section>Section</section>;
// };

// const Header = () => {
//   return <header>Top</header>;
// };

// const Wrapper = () => {
//   return (
//     <div>
//       <Header />
//       <Section />
//       <Footer />
//     </div>
//   );
// };

// const App = () => {
//   return (
//     <div>
//       <Wrapper />
//     </div>
//   );
// };

// React.render(
//   {},
//   {},
//   <App />,
//   document.getElementById("root")
// );

// const element = <h1 title="foo">Hello</h1>

const element = (
  <div>
    <h1>Hello World</h1>
    <h2>from Didact</h2>
  </div>
);
const container = document.getElementById("root");
React.render(element, container);
