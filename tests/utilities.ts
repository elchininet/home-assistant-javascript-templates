export const waitForDelay = async () => {
    await new Promise(process.nextTick);
    await new Promise((resolve) => setTimeout(resolve, 1))
};