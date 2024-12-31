export default function generateDashedId() {
    // Helper function to generate random string of specified length
    const generateRandomString = (length: number) => {
      const characters = 'abcdefghijklmnopqrstuvwxyz';
      let result = '';
      for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        result += characters[randomIndex];
      }
      return result;
    };
  
    // Generate three parts of the ID
    const firstPart = generateRandomString(6);
    const secondPart = generateRandomString(4);
    const thirdPart = generateRandomString(3);
  
    // Combine parts with dashes
    return `${firstPart}-${secondPart}-${thirdPart}`;
}
console.log(generateDashedId())