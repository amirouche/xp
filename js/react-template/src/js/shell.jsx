// var React = require("react/addons");

// var ReactCSSTransitionGroup = React.addons.CSSTransitionGroup;



// var Shell = React.createClass({
    
//     getInitialState: function() {
//         return {drawerIsOpen: false};
//     },

//     toggleDrawer: function() {
//         this.setState({drawerIsOpen: !this.state.drawerIsOpen})
//     },
    
//     render: function() {
//         var drawer;
//         if (this.state.drawerIsOpen) {
//             drawer = (
//                     <ReactCSSTransitionGroup transitionName="drawer">
//                     <Drawer key="drawer" />
//                     <div id="overlay"></div>
//                     </ReactCSSTransitionGroup>
//             );
//         } else {
//             drawer = (
//                     <ReactCSSTransitionGroup transitionName="drawer">
//                     </ReactCSSTransitionGroup>
//             );

//         }
//         return (
//                 <div id="wrapper">
//                 <Header drawerIsOpen={this.state.drawerIsOpen} toggleDrawer={this.toggleDrawer} />
//                 {drawer}
//                 <Inbox/>
//                 </div>
//         )
        
//     }
// });



// React.render(<Shell />, document.getElementsByTagName('body')[0]);
