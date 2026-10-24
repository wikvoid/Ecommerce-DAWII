package hardware.store.pe.config;

import org.springframework.amqp.core.*;
import org.springframework.amqp.support.converter.JacksonJsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    public static final String QUEUE_ORDERS = "ferremas_orders_queue";
    public static final String EXCHANGE_ORDERS = "ferremas_orders_exchange";
    public static final String ROUTING_KEY_ORDERS = "ferremas.routing.orders";

    @Bean
    public Queue ordersQueue() {
        return new Queue(QUEUE_ORDERS, true);
    }

    @Bean
    public TopicExchange ordersExchange() {
        return new TopicExchange(EXCHANGE_ORDERS);
    }

    @Bean
    public Binding bindingOrders(Queue ordersQueue, TopicExchange ordersExchange) {
        return BindingBuilder.bind(ordersQueue).to(ordersExchange).with(ROUTING_KEY_ORDERS);
    }

    @Bean
    public MessageConverter jsonMessageConverter() {
        return new JacksonJsonMessageConverter();
    }
}