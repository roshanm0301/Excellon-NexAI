import { Link } from "react-router-dom";
import NotFoundImage from '../../assets/not-found.svg';
import SingleCardWithoutHeader from "../../layouts/single-card/single-card-without-header";

const Error = () => {
  return (
    <SingleCardWithoutHeader title="Ohh! page not found">
      <div className="error-page-content">
        <img src={NotFoundImage} width={60} height={50} alt="Page not found" />
        <p>We can't seem to find the page you're looking for</p>
        <Link to="/dashboard" className="error-page-link">Back Home</Link>
      </div>
    </SingleCardWithoutHeader>
  );
};

export default Error;
