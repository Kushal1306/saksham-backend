import moment from 'moment-timezone';

export const convertDate=(inputDateTime)=>{
    const istTimeFormat = "DD/MM/YYYY HH:mm"; // Format for input date
    const expiryMoment = moment.tz(inputDateTime, istTimeFormat, "Asia/Kolkata").utc();
    return expiryMoment.toDate(); // Return as a Date object
}